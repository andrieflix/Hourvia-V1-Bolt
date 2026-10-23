# Proposed Database Schema — For Operator Approval (Sprint 1A.1 Remediated)

**Status: PENDING APPROVAL — DO NOT APPLY**
**Date: 2026-10-23 (revised 2026-10-23 — Sprint 1A.1)**
**Revision: 2 — Security remediations applied to all identified issues**

This document defines the proposed database schema for Hourvia's organization and membership system.
No migrations will be applied until this schema is reviewed and approved by the operator.

The Sprint 1A.1 revision fixes five security issues identified in the Sprint 1 design:
1. RLS recursion in membership SELECT policy (fixed via `is_active_member` helper)
2. Partial unique index only guarantees "at most one" owner, not "exactly one" (fixed via constraint trigger)
3. Broad UPDATE grant on `user_profiles` (fixed via column-restricted grant)
4. `create_organization` function needs hardening (fixed: arg validation, slug collision, search_path)
5. No account deletion safety design (fixed via `prevent_sole_owner_user_deletion` trigger)

The complete SQL migration candidate is in `docs/migration-candidate-create-core-tables.sql`.
The security audit detailing all findings and remediations is in `docs/sprint-1a1-security-audit.md`.

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

**Trigger:** `set_updated_at` auto-update on row modification.

### 1.2 `organizations`

Stores organization records. Ownership is derived from `organization_memberships` (role = 'OWNER', status = 'ACTIVE'), NOT stored as a column on this table. This prevents clients from setting ownership directly.

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
- **Partial unique index on `(organization_id)` WHERE `role = 'OWNER' AND status = 'ACTIVE'`** — enforces at most one active owner per org (see Section 4)

---

## 2. Constraints and Indexes

### 2.1 Unique Constraints
- `organizations.slug` — unique slugs across the platform
- `organization_memberships(user_id, organization_id)` WHERE `status = 'ACTIVE'` — prevents duplicate active memberships
- `organization_memberships(organization_id)` WHERE `role = 'OWNER' AND status = 'ACTIVE'` — at-most-one owner (combined with constraint trigger for exactly-one)

### 2.2 Foreign Keys
- `user_profiles.id` → `auth.users(id)` ON DELETE CASCADE
- `organization_memberships.organization_id` → `organizations(id)` ON DELETE CASCADE
- `organization_memberships.user_id` → `auth.users(id)` ON DELETE CASCADE

### 2.3 Check Constraints
- `organizations.status` IN (`'ACTIVE'`, `'SUSPENDED'`)
- `organization_memberships.role` IN (`'OWNER'`, `'ADMIN'`, `'MANAGER'`, `'EMPLOYEE'`, `'CONTRACTOR'`)
- `organization_memberships.status` IN (`'ACTIVE'`, `'REVOKED'`, `'PENDING'`)

### 2.4 Constraint Triggers (NEW in Sprint 1A.1)
- `trg_ensure_single_owner` — AFTER INSERT/UPDATE/DELETE on `organization_memberships`, DEFERRABLE INITIALLY IMMEDIATE. Calls `check_single_owner()` which counts active owners per org and raises `check_violation` if count != 1.
- `trg_prevent_sole_owner_user_deletion` — BEFORE DELETE on `auth.users`. Calls `check_sole_owner_before_user_delete()` which blocks deletion if the user is the sole owner of any organization.

---

## 3. RLS Policy Design

All three tables enable RLS. Policies scope to `authenticated` only (the app has a sign-in screen).

### 3.1 `user_profiles`

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "user_profiles_select_own" | `auth.uid() = id` |
| INSERT | "user_profiles_insert_own" | `auth.uid() = id` (WITH CHECK) |
| UPDATE | "user_profiles_update_own" | `auth.uid() = id` (USING + WITH CHECK) |

**Grant:** `SELECT, INSERT` on `user_profiles` to `authenticated`.
**UPDATE:** Column-restricted — `REVOKE UPDATE` then `GRANT UPDATE (display_name, avatar_url)` to `authenticated`.

**REMEDIATION (Sprint 1A.1):** The Sprint 1 design granted a broad table-level UPDATE, which would let users modify `created_at` and other non-editable columns. The column-restricted grant ensures users can only change `display_name` and `avatar_url`.

### 3.2 `organizations`

Users can see organizations where they have an active membership. Direct INSERT/UPDATE/DELETE is NOT granted to `authenticated` — all org mutations go through the `SECURITY DEFINER` provisioning function.

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "organizations_select_member" | `public.is_active_member(auth.uid(), organizations.id)` |

**Grant:** `SELECT` on `organizations` to `authenticated` only.

**REMEDIATION (Sprint 1A.1):** The predicate now uses the `is_active_member` SECURITY DEFINER helper instead of an inline subquery on `organization_memberships`. This avoids the RLS recursion documented in Section 5.

### 3.3 `organization_memberships`

Users can see memberships within organizations they belong to. Direct INSERT/UPDATE/DELETE is NOT granted to `authenticated` — all membership mutations go through `SECURITY DEFINER` functions.

| Verb | Policy Name | Predicate |
|------|-------------|-----------|
| SELECT | "memberships_select_org_member" | `public.is_active_member(auth.uid(), organization_memberships.organization_id)` |

**Grant:** `SELECT` on `organization_memberships` to `authenticated` only.

**REMEDIATION (Sprint 1A.1):** The Sprint 1 design's SELECT policy queried `organization_memberships` inside its own USING clause, causing infinite recursion. The `is_active_member` helper (SECURITY DEFINER, bypasses RLS) breaks this cycle by returning a boolean without re-entering policy evaluation.

---

## 4. Ownership Invariant Enforcement

### The Problem
"Exactly one active OWNER per organization" must hold even under concurrent operations and all edge cases:
- Adding a second owner
- Removing the only owner (revocation)
- Demoting the only owner (role change)
- Transferring ownership (atomic old→new swap)
- User account deletion (cascade)
- Concurrent transfers

### Solution: Two-Layer Enforcement

#### Layer 1: Partial Unique Index (at-most-one)

```sql
CREATE UNIQUE INDEX idx_one_active_owner_per_org
  ON organization_memberships (organization_id)
  WHERE role = 'OWNER' AND status = 'ACTIVE';
```

This prevents two active owners from ever existing for the same org. PostgreSQL checks the unique index at the row-level lock point, so concurrent transactions cannot both add a second owner.

#### Layer 2: Constraint Trigger (exactly-one)

```sql
CREATE CONSTRAINT TRIGGER trg_ensure_single_owner
  AFTER INSERT OR UPDATE OR DELETE ON organization_memberships
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION check_single_owner();
```

The `check_single_owner()` function counts active owners for the affected organization and raises `check_violation` if the count is not exactly 1. This catches the zero-owner case that the index cannot prevent:
- **Revoking the only owner:** count drops to 0 → rejected
- **Demoting the only owner:** count drops to 0 → rejected
- **User deletion cascade:** prevented at the source by `trg_prevent_sole_owner_user_deletion` (BEFORE DELETE on auth.users)

### Why Two Layers?
The partial unique index alone only guarantees "at most one" — it allows zero. The constraint trigger closes the gap by rejecting zero. Together they enforce "exactly one."

### Transfer Safety
The `transfer_ownership` function performs both role changes (demote old, promote new) in a single CTE-based UPDATE statement. The constraint trigger is `DEFERRABLE INITIALLY IMMEDIATE`, so it checks at statement end when the count is 1 (new owner exists, old owner demoted). The intermediate state where both or neither are owners is not visible at statement end.

### Can this be safely enforced with Supabase primitives?
**YES.** Partial unique indexes, constraint triggers, and SECURITY DEFINER functions are all core PostgreSQL features, fully supported in Supabase.

---

## 5. RLS Recursion Remediation

### The Problem (Sprint 1 Design)
The Sprint 1 membership SELECT policy was:

```sql
-- BROKEN: queries the same table inside its own policy
USING (EXISTS (
  SELECT 1 FROM organization_memberships AS m
  WHERE m.user_id = auth.uid()
    AND m.organization_id = organization_memberships.organization_id
    AND m.status = 'ACTIVE'
))
```

When PostgreSQL evaluates this SELECT policy on `organization_memberships`, the subquery itself queries `organization_memberships`, which triggers the same SELECT policy again — infinite recursion. The query either errors out or returns zero rows (depending on PostgreSQL's recursion detection).

### The Fix: `is_active_member` SECURITY DEFINER Helper

```sql
CREATE OR REPLACE FUNCTION public.is_active_member(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships m
    WHERE m.user_id = p_user_id
      AND m.organization_id = p_org_id
      AND m.status = 'ACTIVE'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid, uuid) TO authenticated;
```

**How it breaks the recursion:**
- `SECURITY DEFINER` makes the function run as the table owner, bypassing RLS
- The function queries `organization_memberships` without triggering the SELECT policy
- The policy calls the function, which returns a boolean — no recursion

**Security properties:**
- `SET search_path = public` prevents search_path injection
- `REVOKE EXECUTE FROM PUBLIC, anon` ensures only authenticated users can call it
- The function takes explicit `p_user_id` and `p_org_id` parameters; callers pass `auth.uid()` (server-derived, not client-supplied)

Both the `organizations` and `organization_memberships` SELECT policies use this helper.

---

## 6. Organization Provisioning — Hardened `create_organization`

The `create_organization` SECURITY DEFINER function creates a new org and an OWNER membership for the calling user.

### Hardening Applied (Sprint 1A.1)

| Issue | Sprint 1 | Sprint 1A.1 |
|-------|----------|-------------|
| search_path | Set but not documented | Set and documented |
| Caller validation | `auth.uid()` check | Same + proper SQLSTATE |
| Name validation | None | Non-empty check (23502) |
| Slug validation | None | Non-empty + format regex (23514) |
| Slug collision | Unhandled (raw unique_violation) | Caught, friendly message (23505) |
| Table references | Unqualified | Schema-qualified (`public.`) |
| EXECUTE grants | Revoked from PUBLIC/anon | Same |
| user_profiles upsert | Present | Same |

### Slug Validation Rules
- Lowercase alphanumeric and hyphens only
- 3-50 characters
- Cannot start or end with a hyphen
- Regex: `^[a-z0-9](?:[a-z0-9\-]{1,48}[a-z0-9])?$`

---

## 7. Account Deletion Safety

### The Problem
When a user is deleted from `auth.users`, `ON DELETE CASCADE` removes their `organization_memberships` rows. If the user is the sole owner of an org, this leaves the org with zero owners — orphaning it permanently. No one can manage or dissolve the org.

### The Fix: `prevent_sole_owner_user_deletion` Trigger

```sql
CREATE TRIGGER trg_prevent_sole_owner_user_deletion
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION check_sole_owner_before_user_delete();
```

The function checks whether the user being deleted is the sole active owner of any organization. If so, it raises `check_violation` and blocks the deletion. The user must transfer ownership (or dissolve the org) before their account can be deleted.

### ON DELETE CASCADE Analysis
- `user_profiles.id` → `auth.users(id)` ON DELETE CASCADE: Safe — profile data is per-user
- `organization_memberships.user_id` → `auth.users(id)` ON DELETE CASCADE: Protected by the sole-owner trigger
- `organization_memberships.organization_id` → `organizations(id)` ON DELETE CASCADE: Safe — deleting an org removes its memberships (org deletion is via SECURITY DEFINER only, not granted to authenticated)

---

## 8. SECURITY DEFINER Functions Summary

| Function | Purpose | Granted to | search_path |
|----------|---------|-----------|-------------|
| `is_active_member` | RLS policy helper — breaks recursion | authenticated | public |
| `create_organization` | Create org + OWNER membership | authenticated | public |
| `transfer_ownership` | Transfer ownership atomically | NOT YET (Sprint 2) | public |
| `revoke_membership` | Revoke a member | NOT YET (Sprint 2) | public |
| `check_single_owner` | Constraint trigger function | trigger-only | public |
| `check_sole_owner_before_user_delete` | Pre-delete safety trigger | trigger-only | public |
| `set_updated_at` | Auto-update updated_at | trigger-only | public |

All functions have:
- `SECURITY DEFINER` (runs as owner, bypasses RLS)
- `SET search_path = public` (prevents search_path injection)
- `REVOKE EXECUTE FROM PUBLIC, anon` (not callable by unauthenticated)

---

## 9. Security Posture Summary

| Requirement | Enforcement |
|-------------|-------------|
| Server-derived user ID | `auth.uid()` in RLS and SECURITY DEFINER functions |
| No client-selected roles | No INSERT grant on memberships; role set only by SECURITY DEFINER function |
| RLS enabled | All three tables have RLS enabled with explicit policies |
| Tenant-scoped reads | SELECT policies use `is_active_member` helper for membership check |
| Cross-tenant denied | RLS filters rows — no cross-org access possible |
| Owner assignment protected | Only `create_organization` function can assign OWNER role |
| Exactly-one owner | Partial unique index (at-most-one) + constraint trigger (not-zero) |
| Account deletion safety | `prevent_sole_owner_user_deletion` trigger blocks sole-owner deletion |
| No RLS recursion | `is_active_member` SECURITY DEFINER helper breaks self-reference |
| Column-restricted updates | `user_profiles` UPDATE limited to `display_name`, `avatar_url` |
| Hardened functions | Arg validation, slug collision, search_path, schema-qualified refs |
| No privileged credentials in browser | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend |

---

## 10. Migration Plan (After Approval)

The migration candidate SQL is in `docs/migration-candidate-create-core-tables.sql`.
It will be applied as a single `apply_migration` call with the filename `create_core_tables`.

It contains:
1. `set_updated_at` trigger function
2. `user_profiles` table with RLS, policies, column-restricted grants
3. `organizations` table with RLS and SELECT-only policy (using `is_active_member`)
4. `organization_memberships` table with RLS and SELECT-only policy (using `is_active_member`)
5. `is_active_member` SECURITY DEFINER helper function
6. `check_single_owner` constraint trigger function + trigger
7. `check_sole_owner_before_user_delete` trigger function + trigger on auth.users
8. `create_organization` hardened SECURITY DEFINER function
9. `transfer_ownership` SECURITY DEFINER function (not yet granted)
10. `revoke_membership` SECURITY DEFINER function (not yet granted)
11. All indexes, grants, and EXECUTE revocations

---

## APPROVAL REQUEST

**No database migrations will be applied until the operator reviews and approves this schema design.**

Please confirm:
1. The three-table structure and column definitions are acceptable
2. The RLS policy approach (SELECT-only on orgs/memberships, mutations via SECURITY DEFINER) is acceptable
3. The `is_active_member` helper approach for breaking RLS recursion is acceptable
4. The two-layer ownership invariant (partial unique index + constraint trigger) is acceptable
5. The account deletion safety (sole-owner prevention trigger) is acceptable
6. The hardened `create_organization` function (arg validation, slug collision) is acceptable
7. The column-restricted UPDATE on `user_profiles` is acceptable
8. You authorize the migration to be applied to the provisioned Supabase project
