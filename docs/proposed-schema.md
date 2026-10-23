# Proposed Database Schema — For Operator Approval

**Status: PENDING APPROVAL — DO NOT APPLY**
**Date: 2026-10-23**

This document defines the proposed database schema for Hourvia's organization and membership system.
No migrations will be applied until this schema is reviewed and approved by the operator.

---

## 1. Tables

### 1.1 `user_profiles`

Stores public profile data linked to authenticated Supabase users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Linked to authenticated user identity |
| `display_name` | `text` | NOT NULL | User's display name |
| `avatar_url` | `text` | nullable | Optional avatar URL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Creation timestamp (UTC) |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Last update timestamp (UTC) |

**Indexes:** None beyond PK.

**Trigger:** `updated_at` auto-update on row modification.

### 1.2 `organizations`

Stores organization records. Ownership is derived from `organization_memberships` (role = 'OWNER'), NOT stored as a column on this table. This prevents clients from setting ownership directly.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | Unique organization ID |
| `name` | `text` | NOT NULL | Organization name |
| `slug` | `text` | NOT NULL, UNIQUE | URL-friendly identifier |
| `status` | `text` | NOT NULL DEFAULT `'ACTIVE'` CHECK in (`'ACTIVE'`, `'SUSPENDED'`) | Organization status |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Creation timestamp (UTC) |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Last update timestamp (UTC) |

**Indexes:** Unique index on `slug`.

### 1.3 `organization_memberships`

Links users to organizations with roles. This is the tenancy boundary table — RLS policies on all future tables will check membership through this table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | Unique membership ID |
| `organization_id` | `uuid` | NOT NULL, FK → `organizations(id)` ON DELETE CASCADE | Organization reference |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Authenticated user reference |
| `role` | `text` | NOT NULL CHECK in (`'OWNER'`, `'ADMIN'`, `'MANAGER'`, `'EMPLOYEE'`, `'CONTRACTOR'`) | Member role |
| `status` | `text` | NOT NULL DEFAULT `'ACTIVE'` CHECK in (`'ACTIVE'`, `'REVOKED'`, `'PENDING'`) | Membership status |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Creation timestamp (UTC) |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Last update timestamp (UTC) |
| `revoked_at` | `timestamptz` | nullable | When membership was revoked (UTC) |

**Indexes:**
- Unique index on `(user_id, organization_id)` WHERE `status = 'ACTIVE'` — enforces one active membership per user per org
- Index on `organization_id` for team listing queries
- Index on `user_id` for "my organizations" queries
- **Partial unique index on `(organization_id)` WHERE `role = 'OWNER' AND status = 'ACTIVE'`** — enforces exactly one active owner per org (see Section 4)

---

## 2. Constraints and Indexes

### 2.1 Unique Constraints
- `organizations.slug` — unique slugs across the platform
- `organization_memberships(user_id, organization_id)` WHERE `status = 'ACTIVE'` — prevents duplicate active memberships
- `organization_memberships(organization_id)` WHERE `role = 'OWNER' AND status = 'ACTIVE'` — the single-owner invariant

### 2.2 Foreign Keys
- `user_profiles.id` → `auth.users(id)` ON DELETE CASCADE
- `organization_memberships.organization_id` → `organizations(id)` ON DELETE CASCADE
- `organization_memberships.user_id` → `auth.users(id)` ON DELETE CASCADE

### 2.3 Check Constraints
- `organizations.status` IN (`'ACTIVE'`, `'SUSPENDED'`)
- `organization_memberships.role` IN (`'OWNER'`, `'ADMIN'`, `'MANAGER'`, `'EMPLOYEE'`, `'CONTRACTOR'`)
- `organization_memberships.status` IN (`'ACTIVE'`, `'REVOKED'`, `'PENDING'`)

---

## 3. RLS Policy Design

All three tables enable RLS. Policies scope to `authenticated` only (the app has a sign-in screen).

### 3.1 `user_profiles`

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "Users can read own profile" | `auth.uid() = id` |
| INSERT | "Users can insert own profile" | `auth.uid() = id` (WITH CHECK) |
| UPDATE | "Users can update own profile" | `auth.uid() = id` (USING + WITH CHECK) |

**Grant:** `SELECT, INSERT, UPDATE` on `user_profiles` to `authenticated`.
Column-restricted UPDATE: `GRANT UPDATE (display_name, avatar_url) ON user_profiles TO authenticated;`

### 3.2 `organizations`

Users can see organizations where they have an active membership. Direct INSERT/UPDATE/DELETE is NOT granted to `authenticated` — all org mutations go through the `SECURITY DEFINER` provisioning function.

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "Members can view their orgs" | `EXISTS (SELECT 1 FROM organization_memberships WHERE organization_memberships.user_id = auth.uid() AND organization_memberships.organization_id = organizations.id AND organization_memberships.status = 'ACTIVE')` |

**Grant:** `SELECT` on `organizations` to `authenticated` only.

### 3.3 `organization_memberships`

Users can see memberships within organizations they belong to. Direct INSERT/UPDATE/DELETE is NOT granted to `authenticated` — all membership mutations go through `SECURITY DEFINER` functions.

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "Members can view their org's memberships" | `EXISTS (SELECT 1 FROM organization_memberships AS m WHERE m.user_id = auth.uid() AND m.organization_id = organization_memberships.organization_id AND m.status = 'ACTIVE')` |

**Grant:** `SELECT` on `organization_memberships` to `authenticated` only.

---

## 4. Ownership Invariant Enforcement

### The Problem
"Exactly one active OWNER per organization" must hold even under concurrent operations. Two concurrent transactions could both try to add a second owner, or both try to remove the only owner.

### Solution: Partial Unique Index

```sql
CREATE UNIQUE INDEX one_active_owner_per_org
  ON organization_memberships (organization_id)
  WHERE role = 'OWNER' AND status = 'ACTIVE';
```

This is a **database-enforced** constraint — PostgreSQL will reject any INSERT or UPDATE that would result in zero or two active owners for an organization. It works under concurrent transactions because the unique index is checked at the row-level lock point.

- **Adding a second owner:** Fails with unique violation (the index already has a row for that `organization_id`)
- **Removing the only owner (revoking):** The `SECURITY DEFINER` function checks that the target is not the owner before allowing revocation. Even if bypassed, revoking the owner would leave zero active owners — which is allowed by the index alone, so the function MUST guard this case.
- **Transferring ownership:** The `SECURITY DEFINER` transfer function updates the old owner's role and the new owner's role in a single `DO $$ ... END $$` block. The intermediate state (both or neither as owner) is not visible to other transactions within the same atomic block. However, since the unique index is on `role = 'OWNER' AND status = 'ACTIVE'`, the intermediate state where both are owners would violate the index. The function must therefore update the old owner first (removing OWNER role) then set the new owner. If the old owner is updated to a non-OWNER role, the index row is freed, and the new owner can take it.

### Can this be safely enforced with Supabase primitives?

**YES.** Partial unique indexes are a core PostgreSQL feature, fully supported in Supabase. The `SECURITY DEFINER` function pattern is also supported and can be created via the `apply_migration` MCP tool. The combination provides:
1. Database-enforced uniqueness (no application-level race conditions)
2. Server-side authorization (no client-controlled role assignment)
3. Atomic operations within PL/pgSQL blocks

---

## 5. Organization Provisioning Transaction Design

The `create_organization` `SECURITY DEFINER` function will:

1. Accept `p_name` (text) and `p_slug` (text) parameters
2. Use `auth.uid()` to get the calling user's ID
3. Insert a new row into `organizations`
4. Insert a new row into `organization_memberships` with `role = 'OWNER'`, `status = 'ACTIVE'`
5. Insert a row into `user_profiles` if one doesn't already exist (upsert)
6. Return the new organization's ID
7. All within a single atomic `DO $$ ... END $$` block

```sql
CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_memberships (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'OWNER', 'ACTIVE');

  INSERT INTO user_profiles (id, display_name)
  VALUES (v_user_id, '')
  ON CONFLICT (id) DO NOTHING;

  RETURN v_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_organization(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
```

### Why SECURITY DEFINER?
- The `authenticated` role has no INSERT grant on `organizations` or `organization_memberships` directly
- The function runs with the table owner's permissions, bypassing RLS for the specific operation
- The function is the ONLY path to create organizations — clients cannot bypass it
- `REVOKE EXECUTE FROM PUBLIC, anon` ensures only authenticated users can call it

---

## 6. Rollback and Recovery Implications

### Migration Safety
- All `CREATE TABLE` statements use `IF NOT EXISTS`
- All `CREATE POLICY` statements are preceded by `DROP POLICY IF EXISTS`
- The migration is idempotent — safe to re-apply if a timeout occurs
- No `DROP` or `DELETE` operations — no data loss risk

### Recovery Considerations
- If the migration needs to be reversed, tables can be disabled (RLS set to deny-all) without dropping data
- `ON DELETE CASCADE` on foreign keys to `auth.users` means deleting a user cascades to their profiles and memberships — this is intentional
- `ON DELETE CASCADE` on `organization_memberships.organization_id` means deleting an org cascades to its memberships — intentional
- **Org deletion is NOT granted to `authenticated`** — only a future `SECURITY DEFINER` function (Sprint 2+) will allow it, with ownership verification

### What Cannot Be Reversed Without Data Loss
- Dropping tables (not planned)
- Changing column types (not planned)
- Removing the unique index on owner (would break the invariant)

---

## 7. Security Posture Summary

| Requirement | Enforcement |
|-------------|-------------|
| Server-derived user ID | `auth.uid()` in RLS and SECURITY DEFINER functions |
| No client-selected roles | No INSERT grant on memberships; role set only by SECURITY DEFINER function |
| RLS enabled | All three tables have RLS enabled with explicit policies |
| Tenant-scoped reads | SELECT policies check membership existence |
| Cross-tenant denied | RLS filters rows — no cross-org access possible |
| Owner assignment protected | Only `create_organization` function can assign OWNER role |
| Membership revocation respected | Revoked memberships (status = 'REVOKED') fail the `status = 'ACTIVE'` check in all policies |
| No privileged credentials in browser | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend; service role key never exposed |

---

## 8. Migration Plan (After Approval)

The migration will be applied as a single `apply_migration` call with the filename `create_core_tables`. It will contain:

1. Create `user_profiles` table with RLS and policies
2. Create `organizations` table with RLS and SELECT-only policy
3. Create `organization_memberships` table with RLS and SELECT-only policy
4. Create the partial unique index for single-owner invariant
5. Create the `create_organization` SECURITY DEFINER function
6. Create the `updated_at` trigger function and apply to all tables
7. Grant appropriate permissions

---

## APPROVAL REQUEST

**No database migrations will be applied until the operator reviews and approves this schema design.**

Please confirm:
1. The table structure and column definitions are acceptable
2. The RLS policy approach (SELECT-only on orgs/memberships, all mutations via SECURITY DEFINER) is acceptable
3. The ownership invariant (partial unique index) approach is acceptable
4. The `create_organization` SECURITY DEFINER function design is acceptable
5. You authorize the migration to be applied to the provisioned Supabase project
