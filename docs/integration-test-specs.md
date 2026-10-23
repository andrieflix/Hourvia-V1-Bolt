# Sprint 1A.1 Integration Test Specifications

**Status: SPECIFICATIONS ONLY — not executable yet**
**Date: 2026-10-23**

These tests describe the database-level integration tests that must be
run AFTER the schema migration is approved and applied. They cannot
run now because no tables exist.

Each test specifies:
- The operation to perform
- The expected database-level outcome
- Which security mechanism is being verified

---

## Prerequisites

1. Schema migration `create_core_tables` has been applied
2. Two test users created via Supabase auth (user A, user B)
3. Test runs with authenticated Supabase clients (anon key + user session)

---

## Test Suite 1: RLS Recursion Remediation

### 1.1 Membership SELECT does not recurse

**Operation:** User A creates an org, then queries `organization_memberships`.

**Expected:** Query returns rows without error. The `is_active_member`
helper function resolves the membership check without re-entering the
SELECT policy on the same table.

**Verify with:** `SELECT * FROM organization_memberships` via the
Supabase client as user A — should return user A's membership row.

### 1.2 Cross-tenant membership visibility denied

**Operation:** User A creates org-1. User B creates org-2. User A
queries `organization_memberships`.

**Expected:** User A sees only org-1 memberships. User A cannot see
org-2 memberships.

### 1.3 Revoked member cannot see org memberships

**Operation:** User A (owner) revokes user B's membership in org-1.
User B queries `organization_memberships` for org-1.

**Expected:** User B sees zero rows for org-1 (is_active_member returns
false because status = 'REVOKED').

---

## Test Suite 2: Exactly-One-Owner Invariant

### 2.1 New org has exactly one owner

**Operation:** User A calls `create_organization('Test Org', 'test-org')`.

**Expected:** Organization created with one OWNER membership for user A.
The `ensure_single_owner` constraint trigger passes (count = 1).

### 2.2 Adding a second owner fails

**Operation:** Attempt to insert a second OWNER membership via
`execute_sql` or direct INSERT.

**Expected:** Rejected by `idx_one_active_owner_per_org` unique index
(unique_violation, SQLSTATE 23505).

### 2.3 Revoking the only owner fails

**Operation:** Attempt to set the only owner's status to 'REVOKED'.

**Expected:** Rejected by `ensure_single_owner` constraint trigger
(check_violation, SQLSTATE 23514). Error message contains "exactly one
active owner (found 0)".

### 2.4 Demoting the only owner fails

**Operation:** Attempt to change the only owner's role to 'ADMIN'.

**Expected:** Rejected by `ensure_single_owner` constraint trigger
(check_violation). Error message contains "exactly one active owner
(found 0)".

### 2.5 Ownership transfer succeeds

**Operation:** Owner calls `transfer_ownership(org_id, new_owner_id)`
where new_owner is an active member.

**Expected:** Old owner's role becomes 'ADMIN', new owner's role becomes
'OWNER'. Constraint trigger passes (count = 1 at statement end).

### 2.6 Concurrent transfer attempts

**Operation:** Two concurrent transactions attempt to transfer
ownership to different users.

**Expected:** One succeeds, the other fails (either unique index
violation if both promote simultaneously, or constraint trigger
violation if intermediate state has 0 or 2 owners).

**Note:** This requires a real PostgreSQL test with concurrent
transactions. Use `execute_sql` with `BEGIN` ... `COMMIT` in
two parallel calls.

---

## Test Suite 3: Account Deletion Safety

### 3.1 Sole owner user deletion blocked

**Operation:** Attempt to delete a user who is the sole owner of an org
via Supabase auth admin API or direct DELETE on auth.users.

**Expected:** Rejected by `prevent_sole_owner_user_deletion` trigger
(check_violation). Error message contains "sole owner".

### 3.2 Non-sole-owner user deletion allowed

**Operation:** Transfer ownership to user B, then delete user A.

**Expected:** Deletion succeeds. User A's memberships are cascade-
deleted. Org still has user B as owner (count = 1).

### 3.3 Member (non-owner) user deletion allowed

**Operation:** Delete user B who is only an EMPLOYEE in org-1.

**Expected:** Deletion succeeds. User B's membership row is cascade-
deleted. Org-1 still has its owner (count = 1).

---

## Test Suite 4: Grant Corrections

### 4.1 user_profiles UPDATE is column-restricted

**Operation:** User A attempts to UPDATE `created_at` on their own
user_profiles row via the Supabase client.

**Expected:** Rejected with permission denied (SQLSTATE 42501) —
UPDATE grant is only on (display_name, avatar_url).

### 4.2 user_profiles UPDATE of display_name succeeds

**Operation:** User A updates their own display_name.

**Expected:** Succeeds (column is in the granted set).

### 4.3 No direct INSERT on organizations

**Operation:** User A attempts `INSERT INTO organizations` via the
Supabase client.

**Expected:** Rejected with permission denied (42501) — only SELECT
is granted to authenticated.

### 4.4 No direct INSERT on organization_memberships

**Operation:** User A attempts `INSERT INTO organization_memberships`
via the Supabase client.

**Expected:** Rejected with permission denied (42501) — only SELECT
is granted to authenticated.

---

## Test Suite 5: create_organization Function Hardening

### 5.1 Unauthenticated call fails

**Operation:** Call `create_organization` without a session (anon key
only).

**Expected:** Rejected — EXECUTE not granted to anon.

### 5.2 Empty name fails

**Operation:** Authenticated user calls `create_organization('', 'slug')`.

**Expected:** Exception with "Organization name is required"
(SQLSTATE 23502).

### 5.3 Empty slug fails

**Operation:** Authenticated user calls `create_organization('Name', '')`.

**Expected:** Exception with "Organization slug is required"
(SQLSTATE 23502).

### 5.4 Invalid slug format fails

**Operation:** Call `create_organization('Name', 'Invalid Slug!')`.

**Expected:** Exception with slug format message (SQLSTATE 23514).

### 5.5 Slug collision fails with friendly message

**Operation:** User A creates org with slug 'acme'. User B calls
`create_organization('Different', 'acme')`.

**Expected:** Exception "An organization with slug "acme" already exists"
(SQLSTATE 23505).

### 5.6 Successful creation returns org ID

**Operation:** Authenticated user calls `create_organization('Acme', 'acme')`.

**Expected:** Returns a UUID. Organization row exists. Owner membership
exists with role=OWNER, status=ACTIVE. User profile row exists.

---

## Test Suite 6: Security Posture Verification

### 6.1 get_security_posture confirms RLS on all tables

**Operation:** Call `mcp__supabase__get_security_posture`.

**Expected:**
- `user_profiles`: rls_enabled = true
- `organizations`: rls_enabled = true
- `organization_memberships`: rls_enabled = true
- All policies use `auth.uid()`, not `current_user`
- No policy uses `USING (true)` on these tables

### 6.2 get_advisors reports no security findings

**Operation:** Call `mcp__supabase__get_advisors` with type "security".

**Expected:** No findings related to the core tables. Specifically:
- No "RLS enabled but no policy" findings
- No "function callable by every role" findings
- No "view bypasses RLS" findings

### 6.3 All SECURITY DEFINER functions have search_path set

**Operation:** Check `get_security_posture` function listings.

**Expected:**
- `is_active_member`: security_definer = true, search_path_set = true
- `create_organization`: security_definer = true, search_path_set = true
- `check_single_owner`: security_definer = true, search_path_set = true
- `check_sole_owner_before_user_delete`: security_definer = true, search_path_set = true
- `transfer_ownership`: security_definer = true, search_path_set = true
- `revoke_membership`: security_definer = true, search_path_set = true

### 6.4 EXECUTE grants are correct

**Expected:**
- `is_active_member`: EXECUTE on authenticated only (not anon, not PUBLIC)
- `create_organization`: EXECUTE on authenticated only
- `transfer_ownership`: EXECUTE not granted to authenticated (Sprint 2)
- `revoke_membership`: EXECUTE not granted to authenticated (Sprint 2)
- `check_single_owner`: no EXECUTE grant to authenticated (trigger-only)
- `check_sole_owner_before_user_delete`: no EXECUTE grant (trigger-only)
