/*
# Hourvia Core Schema — Remediated Design (Sprint 1A.1)

## PURPOSE
Creates the foundational multi-tenant schema for Hourvia: user profiles,
organizations, and organization memberships with role-based access control.
This is a CANDIDATE migration — NOT applied. Awaiting operator approval.

## TABLES CREATED
1. `user_profiles` — display name and avatar linked to auth.users
2. `organizations` — organization records (ownership derived, not stored)
3. `organization_memberships` — links users to orgs with roles and status

## SECURITY CHANGES (Sprint 1A.1 remediations)
- RLS enabled on all three tables
- SELECT-only grants to `authenticated` on orgs and memberships
- Column-restricted UPDATE on user_profiles (display_name, avatar_url only)
- `is_active_member` SECURITY DEFINER helper breaks RLS recursion on
  membership SELECT policy (Sprint 1 queried the same table inside its
  own policy, causing infinite recursion)
- `create_organization` SECURITY DEFINER function hardened:
  - Fixed search_path = public
  - Caller validation via auth.uid()
  - Argument validation (name/slug non-empty, slug format)
  - Slug collision handled via INSERT exception catch
  - Schema-qualified table references
  - EXECUTE revoked from PUBLIC/anon, granted to authenticated only
- `ensure_single_owner` CONSTRAINT TRIGGER enforces exactly-one-owner
  invariant: fires AFTER any INSERT/UPDATE/DELETE on memberships,
  counts active owners per org, raises if count != 1. Combined with
  the partial unique index (at-most-one), guarantees exactly-one even
  for the zero-owner case (revocation, demotion, user deletion cascade)
- `prevent_sole_owner_user_deletion` CONSTRAINT TRIGGER fires BEFORE
  DELETE on auth.users, blocks deletion when user is sole owner of
  any organization

## IMPORTANT NOTES
1. CANDIDATE ONLY — NOT applied. Awaiting operator approval.
2. Forward-only: no DROP, no DELETE, no ALTER COLUMN TYPE, no RENAME.
3. Idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS
   before CREATE POLICY, CREATE OR REPLACE FUNCTION.
4. is_active_member helper is SECURITY DEFINER with fixed search_path
   and auth.uid() guard; EXECUTE revoked from PUBLIC/anon.
5. Organization ownership derived from memberships (role='OWNER',
   status='ACTIVE'), never stored as a column.

## TO APPLY (after approval)
Use the mcp__supabase__apply_migration tool with filename
"create_core_tables" and the SQL below.
*/

-- =============================================================
-- 1. Updated-at trigger function (shared by all tables)
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- =============================================================
-- 2. user_profiles table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grants: SELECT + INSERT (full row — user creates own profile)
-- UPDATE column-restricted to display_name, avatar_url only
-- (Sprint 1 had a broad table-level UPDATE grant — remediated)
GRANT SELECT, INSERT ON public.user_profiles TO authenticated;
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.user_profiles TO authenticated;

DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================
-- 3. organizations table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  status      text        NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant: SELECT only — all mutations via SECURITY DEFINER functions
GRANT SELECT ON public.organizations TO authenticated;

-- RLS: users can see orgs where they have an ACTIVE membership.
-- Uses is_active_member helper (SECURITY DEFINER) to avoid recursion.
DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
CREATE POLICY "organizations_select_member"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_active_member(auth.uid(), organizations.id));

-- =============================================================
-- 4. organization_memberships table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text        NOT NULL
                    CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CONTRACTOR')),
  status          text        NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'REVOKED', 'PENDING')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_memberships_updated_at ON public.organization_memberships;
CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_membership_per_user_org
  ON public.organization_memberships (user_id, organization_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_memberships_org_id
  ON public.organization_memberships (organization_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id
  ON public.organization_memberships (user_id);

-- Partial unique index: AT MOST one active OWNER per org.
-- Combined with ensure_single_owner constraint trigger (below),
-- guarantees EXACTLY one (prevents zero and two).
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_owner_per_org
  ON public.organization_memberships (organization_id)
  WHERE role = 'OWNER' AND status = 'ACTIVE';

-- Grant: SELECT only — all mutations via SECURITY DEFINER functions
GRANT SELECT ON public.organization_memberships TO authenticated;

-- RLS: users can see memberships in orgs where they are an active
-- member. Uses is_active_member helper to break the recursion that
-- occurred when the Sprint 1 policy queried organization_memberships
-- from within its own SELECT policy.
DROP POLICY IF EXISTS "memberships_select_org_member" ON public.organization_memberships;
CREATE POLICY "memberships_select_org_member"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (public.is_active_member(auth.uid(), organization_memberships.organization_id));

-- =============================================================
-- 5. is_active_member — SECURITY DEFINER helper
--    Breaks RLS recursion in membership/org SELECT policies
-- =============================================================
--
-- Sprint 1 membership SELECT policy referenced
-- organization_memberships inside its own USING clause → infinite
-- recursion. This helper runs as the table owner (bypassing RLS) and
-- returns a boolean, so policies call it without re-entering policy
-- evaluation on the same table.
--
-- Security:
-- - SECURITY DEFINER: runs as owner, bypasses RLS on memberships
-- - SET search_path = public: prevents search_path injection
-- - EXECUTE revoked from PUBLIC and anon; granted to authenticated only

CREATE OR REPLACE FUNCTION public.is_active_member(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.user_id = p_user_id
      AND m.organization_id = p_org_id
      AND m.status = 'ACTIVE'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid, uuid) TO authenticated;

-- =============================================================
-- 6. ensure_single_owner — CONSTRAINT TRIGGER
--    Enforces EXACTLY one active owner per organization
-- =============================================================
--
-- The partial unique index (idx_one_active_owner_per_org) guarantees
-- AT MOST one active owner. It cannot prevent ZERO owners (revoking
-- the only owner, demoting the only owner, user deletion cascade).
-- This constraint trigger fires AFTER any membership change and
-- rejects any operation that would leave an org with active owner
-- count != 1.
--
-- Why CONSTRAINT TRIGGER (not regular trigger)?
-- - Deferred to end of statement, allowing multi-row operations
--   within a single function to complete before the invariant check
-- - Raises an exception that aborts and rolls back the violating change
--
-- Edge cases handled:
-- - Revoking the only owner → count=0 → rejected
-- - Demoting the only owner (role change) → count=0 → rejected
-- - Transferring ownership (old→new in one statement) → count=1 → passes
-- - Adding a second owner → unique index catches first; trigger also
--   catches count=2
-- - New org creation (one OWNER inserted) → count=1 → passes
-- - User deletion cascade → prevent_sole_owner_user_deletion (section 7)
--   blocks before the cascade reaches memberships

CREATE OR REPLACE FUNCTION public.check_single_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id       uuid;
  v_owner_count  integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
  ELSE
    v_org_id := NEW.organization_id;
  END IF;

  -- Optimization: skip non-owner rows unless demoting a former owner
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.role != 'OWNER' THEN
    IF TG_OP = 'UPDATE' AND OLD.role = 'OWNER' AND OLD.status = 'ACTIVE' THEN
      NULL; -- demotion: fall through to count check
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_owner_count
  FROM public.organization_memberships
  WHERE organization_id = v_org_id
    AND role = 'OWNER'
    AND status = 'ACTIVE';

  IF v_owner_count != 1 THEN
    RAISE EXCEPTION 'Organization % must have exactly one active owner (found %)',
      v_org_id, v_owner_count
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_single_owner() FROM PUBLIC, anon;
-- No grant to authenticated — trigger-only, not callable by clients

DROP TRIGGER IF EXISTS trg_ensure_single_owner ON public.organization_memberships;
CREATE CONSTRAINT TRIGGER trg_ensure_single_owner
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_memberships
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION public.check_single_owner();

-- =============================================================
-- 7. prevent_sole_owner_user_deletion — BEFORE DELETE on auth.users
--    Blocks user deletion when they are the sole owner of any org
-- =============================================================
--
-- When a user is deleted from auth.users, ON DELETE CASCADE removes
-- their membership rows. If the user is the sole owner of an org,
-- this would leave the org with zero owners — orphaning it.
-- This trigger fires BEFORE the cascade, checks sole-ownership, and
-- blocks the deletion if so. The user must transfer ownership first.

CREATE OR REPLACE FUNCTION public.check_sole_owner_before_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_count integer;
BEGIN
  SELECT COUNT(DISTINCT m.organization_id) INTO v_org_count
  FROM public.organization_memberships m
  WHERE m.user_id = OLD.id
    AND m.role = 'OWNER'
    AND m.status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1
      FROM public.organization_memberships m2
      WHERE m2.organization_id = m.organization_id
        AND m2.role = 'OWNER'
        AND m2.status = 'ACTIVE'
        AND m2.user_id != OLD.id
    );

  IF v_org_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete user %: they are the sole owner of % organization(s). Transfer ownership first.',
      OLD.id, v_org_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_sole_owner_before_user_delete() FROM PUBLIC, anon;
-- No grant to authenticated — trigger-only

DROP TRIGGER IF EXISTS trg_prevent_sole_owner_user_delete ON auth.users;
CREATE TRIGGER trg_prevent_sole_owner_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_sole_owner_before_user_delete();

-- =============================================================
-- 8. create_organization — SECURITY DEFINER provisioning function
-- =============================================================
--
-- Hardened from Sprint 1 design:
-- - SET search_path = public
-- - Caller validation: auth.uid() must not be NULL
-- - Argument validation: name/slug non-empty, slug format check
-- - Slug collision: catches unique_violation, re-raises friendly message
-- - Schema-qualified table references
-- - EXECUTE revoked from PUBLIC/anon, granted to authenticated only
-- - ensure_single_owner constraint trigger validates result (count=1)

CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id   uuid;
  v_user_id  uuid := auth.uid();
BEGIN
  -- 1. Caller validation
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Argument validation
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Organization name is required'
      USING ERRCODE = '23502';
  END IF;

  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'Organization slug is required'
      USING ERRCODE = '23502';
  END IF;

  -- Slug format: lowercase alphanumeric and hyphens, 3-50 chars
  IF p_slug !~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?
    RAISE EXCEPTION 'Slug must be 3-50 characters, lowercase alphanumeric and hyphens only'
      USING ERRCODE = '23514';
  END IF;

  -- 3. Ensure user profile exists (upsert)
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (v_user_id, '')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Insert organization (catch slug collision)
  BEGIN
    INSERT INTO public.organizations (name, slug)
    VALUES (p_name, p_slug)
    RETURNING id INTO v_org_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'An organization with slug "%" already exists', p_slug
        USING ERRCODE = '23505';
  END;

  -- 5. Insert OWNER membership (constraint trigger validates count=1)
  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'OWNER', 'ACTIVE');

  -- 6. Return the new organization ID
  RETURN v_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;

-- =============================================================
-- 9. transfer_ownership — SECURITY DEFINER (Sprint 2+ preview)
--    Defined now, NOT granted to authenticated yet.
-- =============================================================

CREATE OR REPLACE FUNCTION public.transfer_ownership(
  p_org_id    uuid,
  p_new_owner uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_owner uuid;
  v_actor_id      uuid := auth.uid();
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO v_current_owner
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND role = 'OWNER'
    AND status = 'ACTIVE';

  IF v_current_owner IS NULL THEN
    RAISE EXCEPTION 'No active owner found for this organization' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_owner != v_actor_id THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership' USING ERRCODE = '42501';
  END IF;

  IF p_new_owner = v_current_owner THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself' USING ERRCODE = '23514';
  END IF;

  IF NOT public.is_active_member(p_new_owner, p_org_id) THEN
    RAISE EXCEPTION 'Target user must be an active member of this organization' USING ERRCODE = 'P0003';
  END IF;

  -- Atomic transfer: demote old owner + promote new owner in one CTE.
  -- Both updates apply simultaneously so the constraint trigger sees
  -- count=1 at statement end.
  WITH demoted AS (
    UPDATE public.organization_memberships
    SET role = 'ADMIN', updated_at = now()
    WHERE organization_id = p_org_id
      AND user_id = v_current_owner
      AND role = 'OWNER'
      AND status = 'ACTIVE'
    RETURNING 1
  ),
  promoted AS (
    UPDATE public.organization_memberships
    SET role = 'OWNER', updated_at = now()
    WHERE organization_id = p_org_id
      AND user_id = p_new_owner
      AND status = 'ACTIVE'
    RETURNING 1
  )
  SELECT 1 FROM demoted, promoted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) FROM PUBLIC, anon;
-- NOT granted to authenticated — activated in Sprint 2

-- =============================================================
-- 10. revoke_membership — SECURITY DEFINER (Sprint 2+ preview)
--     Defined now, NOT granted to authenticated yet.
-- =============================================================

CREATE OR REPLACE FUNCTION public.revoke_membership(
  p_org_id      uuid,
  p_target_user uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id     uuid := auth.uid();
  v_target_role  text;
  v_actor_role   text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_actor_role
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND user_id = v_actor_id
    AND status = 'ACTIVE';

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'You are not an active member of this organization' USING ERRCODE = '42501';
  END IF;

  IF p_target_user = v_actor_id THEN
    RAISE EXCEPTION 'Cannot revoke your own membership' USING ERRCODE = '23514';
  END IF;

  SELECT role INTO v_target_role
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND user_id = p_target_user
    AND status = 'ACTIVE';

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target is not an active member' USING ERRCODE = 'P0002';
  END IF;

  IF v_actor_role NOT IN ('OWNER', 'ADMIN') THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke members' USING ERRCODE = '42501';
  END IF;

  IF v_target_role = 'OWNER' THEN
    RAISE EXCEPTION 'Cannot revoke the owner. Transfer ownership first.' USING ERRCODE = '23514';
  END IF;

  IF v_actor_role = 'ADMIN' AND v_target_role = 'ADMIN' THEN
    RAISE EXCEPTION 'Admins cannot revoke other admins' USING ERRCODE = '42501';
  END IF;

  UPDATE public.organization_memberships
  SET status = 'REVOKED', revoked_at = now(), updated_at = now()
  WHERE organization_id = p_org_id
    AND user_id = p_target_user
    AND status = 'ACTIVE';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_membership(uuid, uuid) FROM PUBLIC, anon;
-- NOT granted to authenticated — activated in Sprint 2

-- =============================================================
-- END OF MIGRATION CANDIDATE — DO NOT APPLY UNTIL APPROVED
-- =============================================================
 THEN
    RAISE EXCEPTION 'Slug must be 3-50 characters, lowercase alphanumeric and hyphens only'
      USING ERRCODE = '23514';
  END IF;

  -- 3. Ensure user profile exists (upsert)
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (v_user_id, '')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Insert organization (catch slug collision)
  BEGIN
    INSERT INTO public.organizations (name, slug)
    VALUES (p_name, p_slug)
    RETURNING id INTO v_org_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'An organization with slug "%" already exists', p_slug
        USING ERRCODE = '23505';
  END;

  -- 5. Insert OWNER membership (constraint trigger validates count=1)
  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'OWNER', 'ACTIVE');

  -- 6. Return the new organization ID
  RETURN v_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;

-- =============================================================
-- 9. transfer_ownership — SECURITY DEFINER (Sprint 2+ preview)
--    Defined now, NOT granted to authenticated yet.
-- =============================================================

CREATE OR REPLACE FUNCTION public.transfer_ownership(
  p_org_id    uuid,
  p_new_owner uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_owner uuid;
  v_actor_id      uuid := auth.uid();
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO v_current_owner
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND role = 'OWNER'
    AND status = 'ACTIVE';

  IF v_current_owner IS NULL THEN
    RAISE EXCEPTION 'No active owner found for this organization' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_owner != v_actor_id THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership' USING ERRCODE = '42501';
  END IF;

  IF p_new_owner = v_current_owner THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself' USING ERRCODE = '23514';
  END IF;

  IF NOT public.is_active_member(p_new_owner, p_org_id) THEN
    RAISE EXCEPTION 'Target user must be an active member of this organization' USING ERRCODE = 'P0003';
  END IF;

  -- Atomic transfer: demote old owner + promote new owner in one CTE.
  -- Both updates apply simultaneously so the constraint trigger sees
  -- count=1 at statement end.
  WITH demoted AS (
    UPDATE public.organization_memberships
    SET role = 'ADMIN', updated_at = now()
    WHERE organization_id = p_org_id
      AND user_id = v_current_owner
      AND role = 'OWNER'
      AND status = 'ACTIVE'
    RETURNING 1
  ),
  promoted AS (
    UPDATE public.organization_memberships
    SET role = 'OWNER', updated_at = now()
    WHERE organization_id = p_org_id
      AND user_id = p_new_owner
      AND status = 'ACTIVE'
    RETURNING 1
  )
  SELECT 1 FROM demoted, promoted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) FROM PUBLIC, anon;
-- NOT granted to authenticated — activated in Sprint 2

-- =============================================================
-- 10. revoke_membership — SECURITY DEFINER (Sprint 2+ preview)
--     Defined now, NOT granted to authenticated yet.
-- =============================================================

CREATE OR REPLACE FUNCTION public.revoke_membership(
  p_org_id      uuid,
  p_target_user uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id     uuid := auth.uid();
  v_target_role  text;
  v_actor_role   text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_actor_role
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND user_id = v_actor_id
    AND status = 'ACTIVE';

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'You are not an active member of this organization' USING ERRCODE = '42501';
  END IF;

  IF p_target_user = v_actor_id THEN
    RAISE EXCEPTION 'Cannot revoke your own membership' USING ERRCODE = '23514';
  END IF;

  SELECT role INTO v_target_role
  FROM public.organization_memberships
  WHERE organization_id = p_org_id
    AND user_id = p_target_user
    AND status = 'ACTIVE';

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target is not an active member' USING ERRCODE = 'P0002';
  END IF;

  IF v_actor_role NOT IN ('OWNER', 'ADMIN') THEN
    RAISE EXCEPTION 'Insufficient permissions to revoke members' USING ERRCODE = '42501';
  END IF;

  IF v_target_role = 'OWNER' THEN
    RAISE EXCEPTION 'Cannot revoke the owner. Transfer ownership first.' USING ERRCODE = '23514';
  END IF;

  IF v_actor_role = 'ADMIN' AND v_target_role = 'ADMIN' THEN
    RAISE EXCEPTION 'Admins cannot revoke other admins' USING ERRCODE = '42501';
  END IF;

  UPDATE public.organization_memberships
  SET status = 'REVOKED', revoked_at = now(), updated_at = now()
  WHERE organization_id = p_org_id
    AND user_id = p_target_user
    AND status = 'ACTIVE';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_membership(uuid, uuid) FROM PUBLIC, anon;
-- NOT granted to authenticated — activated in Sprint 2

-- =============================================================
-- END OF MIGRATION CANDIDATE — DO NOT APPLY UNTIL APPROVED
-- =============================================================
