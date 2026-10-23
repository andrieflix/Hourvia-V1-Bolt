# Sprint 1A.1 Security Audit Report

**Date:** 2026-10-23
**Sprint:** 1A.1 — Database Schema Security Remediation
**Status:** Complete — migration candidate produced, NOT applied
**Auditor:** Automated review against Sprint 1 proposed schema

---

## Executive Summary

Five security issues were identified in the Sprint 1 proposed schema design. All five have been remediated in the revised schema design. A corrected migration candidate has been produced in `docs/migration-candidate-create-core-tables.sql` but has NOT been applied — it awaits operator approval.

No SQL was executed. No migrations were applied. No database tables were created. Existing authentication was not modified.

---

## Findings

### F-01: RLS Recursion in Membership SELECT Policy

**Severity:** High
**Status:** Remediated
**Category:** Broken access control

**Description:**
The Sprint 1 `organization_memberships` SELECT policy queried `organization_memberships` inside its own USING clause:

```sql
-- Sprint 1 (BROKEN)
USING (EXISTS (
  SELECT 1 FROM organization_memberships AS m
  WHERE m.user_id = auth.uid()
    AND m.organization_id = organization_memberships.organization_id
    AND m.status = 'ACTIVE'
))
```

When PostgreSQL evaluates a SELECT policy on a table, any subquery referencing that same table re-triggers the policy evaluation, causing infinite recursion. The query either errors with `infinite recursion detected in policy` or silently returns zero rows, making all membership data invisible to authenticated users.

The `organizations` SELECT policy had the same issue — it referenced `organization_memberships` in a subquery, which would trigger the recursive membership policy.

**Impact:**
- Users cannot see their own memberships or organizations
- The entire organization switching and team listing feature is broken at the database level
- The app would appear empty for every authenticated user

**Remediation:**
Created an `is_active_member(p_user_id, p_org_id)` SECURITY DEFINER helper function that:
- Runs as the table owner, bypassing RLS (so it can query `organization_memberships` without triggering the policy)
- Returns a boolean (no row-level data exposed)
- Has `SET search_path = public` to prevent search_path injection
- Has `REVOKE EXECUTE FROM PUBLIC, anon` so only authenticated users can call it

Both the `organizations` and `organization_memberships` SELECT policies now call `is_active_member(auth.uid(), org_id)` instead of inline subqueries.

**Verification:** Integration test spec 1.1–1.3 in `docs/integration-test-specs.md`.

---

### F-02: Partial Unique Index Does Not Guarantee Exactly-One Owner

**Severity:** High
**Status:** Remediated
**Category:** Data integrity / business logic

**Description:**
The Sprint 1 design relied solely on a partial unique index to enforce the "exactly one active owner" invariant:

```sql
CREATE UNIQUE INDEX one_active_owner_per_org
  ON organization_memberships (organization_id)
  WHERE role = 'OWNER' AND status = 'ACTIVE';
```

The Sprint 1 schema doc claimed this "prevents zero or two active owners under any condition." This is incorrect. A partial unique index only guarantees **at most one** — it prevents two owners but does NOT prevent zero owners. The following operations would leave an org with zero owners and the index would not block them:

1. **Revoking the only owner:** `UPDATE ... SET status = 'REVOKED'` — the row leaves the partial index (no longer matches `status = 'ACTIVE'`), count drops to 0, index allows it
2. **Demoting the only owner:** `UPDATE ... SET role = 'ADMIN'` — the row leaves the partial index (no longer matches `role = 'OWNER'`), count drops to 0, index allows it
3. **User deletion cascade:** `DELETE FROM auth.users` cascades to memberships, removing the owner row — index allows it

The Sprint 1 doc acknowledged that "the function MUST guard this case" for revocation, but had no database-level enforcement for the demotion or cascade cases. Relying on application-level checks alone is insufficient — a direct data API call or a bug in the function could bypass them.

**Impact:**
- An organization could be orphaned with zero owners
- No one could manage, transfer, or dissolve the org
- The `ensureSingleOwner` domain function would report `valid: false` but nothing at the database level prevents it

**Remediation:**
Added a CONSTRAINT TRIGGER that fires AFTER any INSERT/UPDATE/DELETE on `organization_memberships`:

```sql
CREATE CONSTRAINT TRIGGER trg_ensure_single_owner
  AFTER INSERT OR UPDATE OR DELETE ON organization_memberships
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION check_single_owner();
```

The `check_single_owner()` function counts active owners for the affected org and raises `check_violation` if count != 1. Combined with the partial unique index (at-most-one), this guarantees exactly-one.

The trigger is `DEFERRABLE INITIALLY IMMEDIATE` so that multi-row operations within a single SECURITY DEFINER function (like ownership transfer) complete before the check runs at statement end.

**Verification:** Integration test specs 2.1–2.6 in `docs/integration-test-specs.md`.

---

### F-03: Broad UPDATE Grant on `user_profiles`

**Severity:** Medium
**Status:** Remediated
**Category:** Privilege escalation / column-level access control

**Description:**
The Sprint 1 design documented a column-restricted UPDATE grant in the RLS policy section:

> Column-restricted UPDATE: `GRANT UPDATE (display_name, avatar_url) ON user_profiles TO authenticated;`

However, the migration plan (Section 8) listed grants without specifying the column restriction. If the migration were applied with a table-level `GRANT UPDATE ON user_profiles TO authenticated`, users could modify any column on their own row — including `created_at` and `updated_at` — through the data API, bypassing the `set_updated_at` trigger's intent.

Even though the RLS policy scopes to `auth.uid() = id`, the policy controls which rows are visible, not which columns are writable. A table-level UPDATE grant combined with the row-level policy lets a user update every column on their own row.

**Impact:**
- Users could forge `created_at` timestamps
- Users could set `updated_at` to arbitrary values, defeating the auto-update trigger
- Audit timeline integrity is compromised

**Remediation:**
Explicit column-restricted grant in the migration:

```sql
GRANT SELECT, INSERT ON public.user_profiles TO authenticated;
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.user_profiles TO authenticated;
```

Column privileges are checked BEFORE policies, so this holds even though the policy would allow the row. Users can now only change `display_name` and `avatar_url`.

**Verification:** Integration test spec 4.1–4.2 in `docs/integration-test-specs.md`.

---

### F-04: `create_organization` Function Needs Hardening

**Severity:** Medium
**Status:** Remediated
**Category:** Input validation / error handling

**Description:**
The Sprint 1 `create_organization` function had several gaps:

1. **No argument validation:** Empty or NULL names/slugs would be inserted, producing rows with empty strings
2. **No slug format validation:** Any text would be accepted as a slug, including spaces, uppercase, special characters
3. **No slug collision handling:** A duplicate slug would throw a raw `unique_violation` error exposing the constraint name to the client
4. **Unqualified table references:** `INSERT INTO organizations` without schema qualification could resolve to a different schema if search_path is manipulated (mitigated by `SET search_path = public`, but defense-in-depth requires explicit qualification)

**Impact:**
- Poor data quality (empty names, malformed slugs)
- Raw database errors exposed to clients (information leak)
- Theoretical search_path attack if the function's search_path were changed

**Remediation:**
- Added name/slug non-empty validation with proper SQLSTATE codes
- Added slug format regex: `^[a-z0-9](?:[a-z0-9\-]{1,48}[a-z0-9])?$`
- Added `EXCEPTION WHEN unique_violation` catch with a friendly message
- All table references are now schema-qualified (`public.organizations`, `public.organization_memberships`, `public.user_profiles`)

**Verification:** Integration test specs 5.1–5.6 in `docs/integration-test-specs.md`.

---

### F-05: No Account Deletion Safety Design

**Severity:** High
**Status:** Remediated
**Category:** Data integrity / orphan prevention

**Description:**
The Sprint 1 schema design documented `ON DELETE CASCADE` on foreign keys but did not address what happens when a sole owner's account is deleted:

- `organization_memberships.user_id` → `auth.users(id)` ON DELETE CASCADE
- When a user is deleted from `auth.users`, all their membership rows are cascade-deleted
- If the user is the sole active OWNER of an org, the org is left with zero owners
- The `ensure_single_owner` constraint trigger (F-02 remediation) would fire on the cascade DELETE, but by then it's too late — the user is already being deleted, and there's no way to "undo" the cascade without blocking the deletion itself

The Sprint 1 doc only noted: "Org deletion is NOT granted to `authenticated` — only a future SECURITY DEFINER function (Sprint 2+) will allow it." This did not address the user-deletion cascade path.

**Impact:**
- Deleting a sole owner's account orphans their organization permanently
- The org cannot be managed, transferred, or dissolved
- The constraint trigger from F-02 would actually block the cascade deletion, causing the user deletion to fail with a confusing error — but only if the trigger fires before the cascade completes

**Remediation:**
Added a BEFORE DELETE trigger on `auth.users` that checks sole-ownership before the cascade begins:

```sql
CREATE TRIGGER trg_prevent_sole_owner_user_deletion
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION check_sole_owner_before_user_delete();
```

The function queries for organizations where the user being deleted is the only active owner. If any are found, it raises `check_violation` with a clear message: "Cannot delete user: they are the sole owner of N organization(s). Transfer ownership first."

This blocks the deletion at the source, before any cascade occurs. The user must transfer ownership or dissolve the org first.

**Verification:** Integration test specs 3.1–3.3 in `docs/integration-test-specs.md`.

---

## Additional Security Review

The following items were checked and found clean — no findings:

| Check | Result |
|-------|--------|
| No `USING (true)` on any policy | Clean — all policies have real predicates |
| No `current_user` usage | Clean — all policies use `auth.uid()` |
| No service role key in frontend | Clean — only anon key in `.env` |
| No `FOR ALL` policies | Clean — separate per-verb policies |
| All SECURITY DEFINER functions have search_path | Clean — all set to `public` |
| EXECUTE revoked from PUBLIC/anon on all SECURITY DEFINER functions | Clean |
| No views defined | Clean — no view-bypasses-RLS risk |
| No user_metadata in authorization decisions | Clean — auth.uid() only |
| `maybeSingle()` used in OrganizationContext | Clean — handles missing tables gracefully |

---

## Deferred Items

These items are out of scope for Sprint 1A.1 and deferred to future sprints:

| Item | Sprint | Rationale |
|------|--------|-----------|
| `transfer_ownership` EXECUTE grant | Sprint 2 | Team management UI not built yet |
| `revoke_membership` EXECUTE grant | Sprint 2 | Team management UI not built yet |
| Audit log table | Sprint 2 | Not in Sprint 1A.1 scope |
| Rate limiting on `create_organization` | Sprint 2 | Needs edge function or Supabase feature |
| Organization deletion (SECURITY DEFINER) | Sprint 2 | Requires ownership verification design |
| Database backup verification | Pre-production | Not a schema issue |

---

## Migration Safety Analysis

The migration candidate (`docs/migration-candidate-create-core-tables.sql`) is:

- **Forward-only:** No `DROP TABLE`, no `DELETE`, no `ALTER COLUMN TYPE`, no `RENAME`
- **Idempotent:** `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, `CREATE OR REPLACE FUNCTION`, `CREATE INDEX IF NOT EXISTS`
- **Safe to re-apply:** If `apply_migration` times out after the SQL commits server-side, re-applying with the same filename is safe
- **No data loss risk:** All operations are additive (creating tables, indexes, policies, functions, triggers)

### Schema Drift Detection

If the migration is applied and later needs verification, run:
1. `mcp__supabase__get_security_posture` — confirms RLS state, policies, grants
2. `mcp__supabase__get_advisors` (type: security) — linter checks for common issues
3. `mcp__supabase__list_migrations` — confirms the migration record exists

---

## Files Produced

| File | Purpose |
|------|---------|
| `docs/migration-candidate-create-core-tables.sql` | Complete SQL migration candidate (NOT applied) |
| `docs/proposed-schema.md` | Updated schema design with all remediations |
| `docs/sprint-1a1-security-audit.md` | This audit report |
| `docs/integration-test-specs.md` | Database integration test specifications (run after approval) |
| `src/__tests__/sprint-1a1-security.test.ts` | Offline domain-level security tests |

---

## Constraints

Per the Sprint 1A.1 requirements:

- **No SQL was executed.** No `execute_sql` or `apply_migration` calls were made.
- **No migrations were applied.** The database remains empty.
- **No tables were created.**
- **Organization creation was not activated.** The onboarding page's button remains disabled.
- **Existing authentication was not modified.** No changes to AuthContext, auth routes, or auth tests.

---

## Conclusion

All five security issues identified in the Sprint 1 proposed schema have been remediated in the revised design. The migration candidate is ready for operator review. No database changes have been made.

The next step is operator approval of the revised schema in `docs/proposed-schema.md`, followed by applying the migration via `mcp__supabase__apply_migration` with filename `create_core_tables`.

---

*Hourvia by Living IT Solutions — Time tracked. Progress made.*
