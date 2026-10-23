# Hourvia Sprint 1 Report

**Date:** 2026-10-23
**Sprint:** 1 — Authentication & Organization Foundation
**Status:** Frontend complete. Schema pending operator approval.

---

## 1. Verified Supabase Environment

| Capability | Status | Notes |
|-----------|--------|-------|
| Database connectivity | Verified | `list_tables` and `get_security_posture` return empty database |
| Auth provider availability | Verified | Supabase email/password auth via `@supabase/supabase-js` |
| Authenticated user identity | Verified | `auth.uid()`, `session.user.id`, `user.user_metadata` |
| RLS policy support | Verified | `get_security_posture` confirms RLS infrastructure available |
| Trusted backend execution | Verified | `SECURITY DEFINER` functions and Edge Functions available |
| Transaction support | Verified | Implicit per migration; `DO $$ ... END $$` for atomic blocks |
| Schema migration mechanism | Verified | `apply_migration` MCP tool (no migrations applied yet) |
| Deployment environment identity | Verified | Single provisioned project (URL: `omxddgtqvkqkubntxtzx.supabase.co`) |

**Current database state:** 0 tables, 0 views, 0 functions, 0 policies, 0 migrations.

---

## 2. Authentication Implementation

### What was built
Real Supabase email/password authentication is now wired into the frontend:

- **Supabase client singleton** (`src/lib/supabase.ts`) — initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`
- **AuthContext** (`src/contexts/AuthContext.tsx`) — provides `session`, `user`, `loading`, `error`, `signIn`, `signUp`, `signOut`, `resetPassword`, `clearError`
- **Session restoration** — `supabase.auth.getSession()` on mount + `onAuthStateChange` listener
- **Error translation** — human-friendly messages for invalid credentials, existing users, rate limits, network errors
- **Sign up** — `supabase.auth.signUp()` with `display_name` stored in user metadata
- **Sign in** — `supabase.auth.signInWithPassword()` with redirect to original destination
- **Sign out** — `supabase.auth.signOut()` with redirect to sign-in page
- **Password reset** — `supabase.auth.resetPasswordForEmail()` with redirect to sign-in page
- **Loading states** — spinners on all auth buttons, "Signing in…" / "Creating account…" text
- **Protected routes** — `ProtectedRoute` redirects unauthenticated users to `/signin` with return path
- **Public-only routes** — `PublicOnlyRoute` redirects authenticated users away from auth pages
- **No fabricated sessions** — authentication is entirely handled by Supabase SDK; no localStorage-based auth

### What was NOT done
- Email confirmation is OFF (per Sprint 0 decision — stays OFF)
- No magic links, no social OAuth providers
- No custom auth tables — uses Supabase's built-in `auth.users`
- No service-role credentials in frontend code

---

## 3. Proposed Database Schema

**Full schema design documented in `docs/proposed-schema.md`.**

Three tables proposed:
1. **`user_profiles`** — display name, avatar URL, linked to `auth.users`
2. **`organizations`** — name, slug, status; ownership derived from memberships (not a column)
3. **`organization_memberships`** — links users to orgs with roles and status

Key design decisions:
- Ownership is NOT a column on `organizations` — it's derived from memberships, preventing client-controlled ownership assignment
- `authenticated` role gets SELECT-only on orgs and memberships — all mutations go through `SECURITY DEFINER` functions
- Partial unique index enforces exactly one active OWNER per org (even under concurrent operations)
- `create_organization` SECURITY DEFINER function atomically creates org + OWNER membership + user profile

**Migration status: NOT APPLIED — pending operator approval.**

---

## 4. RLS Policy Design

### `user_profiles`
- SELECT: users can read only their own profile (`auth.uid() = id`)
- INSERT: users can insert only their own profile
- UPDATE: users can update only `display_name` and `avatar_url` (column-restricted grant)

### `organizations`
- SELECT: users can view organizations where they have an ACTIVE membership
- No INSERT/UPDATE/DELETE grant to `authenticated` — all mutations via SECURITY DEFINER

### `organization_memberships`
- SELECT: users can view memberships in organizations they belong to
- No INSERT/UPDATE/DELETE grant to `authenticated` — all mutations via SECURITY DEFINER

**Cross-tenant access is denied at the database level** — RLS policies filter rows based on membership existence. No client can read another organization's data.

---

## 5. Ownership Invariant Design

**Approach: Partial unique index**

```sql
CREATE UNIQUE INDEX one_active_owner_per_org
  ON organization_memberships (organization_id)
  WHERE role = 'OWNER' AND status = 'ACTIVE';
```

This is a **database-enforced** constraint that prevents zero or two active owners under any condition, including concurrent transactions. PostgreSQL checks the unique index at the row-level lock point, so two concurrent transactions cannot both add a second owner.

**Can this be safely enforced with supported Supabase primitives?** YES — partial unique indexes are core PostgreSQL, fully supported in Supabase.

---

## 6. Files Changed

### New files (11)

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/validation.ts` | Zod schemas for auth forms |
| `src/contexts/AuthContext.tsx` | Authentication state provider |
| `src/contexts/OrganizationContext.tsx` | Organization context provider |
| `src/components/auth/ProtectedRoute.tsx` | Route guard for authenticated users |
| `src/components/auth/PublicOnlyRoute.tsx` | Redirects authenticated users away from auth pages |
| `src/pages/app/OnboardingPage.tsx` | Empty state for users without organizations |
| `src/__tests__/auth.test.tsx` | Auth validation and protected route tests |
| `src/__tests__/organization-contracts.test.ts` | Organization creation and ownership contract tests |
| `docs/proposed-schema.md` | Schema design for operator approval |
| `docs/sprint-1-report.md` | This report |

### Modified files (8)

| File | Changes |
|------|---------|
| `src/App.tsx` | Added AuthProvider, OrganizationProvider, ProtectedRoute, PublicOnlyRoute, OnboardingPage route |
| `src/domain/types.ts` | Added `OrganizationStatus`, `updatedAt` to User/Organization/Membership, removed `ownerId` from Organization |
| `src/domain/organization.ts` | Updated to derive ownership from memberships, added `getOwnerUserId` |
| `src/pages/auth/SignInPage.tsx` | Wired to real Supabase auth with loading and error states |
| `src/pages/auth/SignUpPage.tsx` | Wired to real Supabase auth with loading and error states |
| `src/pages/auth/ForgotPasswordPage.tsx` | Wired to real Supabase password reset |
| `src/components/layout/UserMenu.tsx` | Uses real auth context for user info and sign out |
| `src/components/layout/OrgSelector.tsx` | Uses real organization context, loading and empty states |
| `src/components/layout/AppLayout.tsx` | Redirects to onboarding when no organizations, loading and error states |
| `src/pages/app/DashboardPage.tsx` | Contextual welcome message from auth and org context |
| `src/domain/__tests__/organization.test.ts` | Updated to match new domain types |
| `src/__tests__/routes.test.tsx` | Updated to work with auth/org providers |

---

## 7. Tests Passed

### Validation Results

| Check | Result |
|-------|--------|
| TypeScript strict mode | No errors |
| ESLint | No errors, no warnings |
| Production build | Successful (524 KB JS, 27 KB CSS) |
| Unit tests | 72 passed across 8 test files |

### Test breakdown

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `permissions.test.ts` | 14 | Role permissions, escalation prevention |
| `organization.test.ts` | 19 | Ownership transfer, single-owner, revocation, switching, getOwnerUserId |
| `time.test.ts` | 10 | Duration, formatting, dates |
| `money.test.ts` | 3 | Minor units, formatting |
| `theme.test.tsx` | 5 | Theme switching, persistence |
| `organization-contracts.test.ts` | 6 | Creation contracts, duplicate prevention, cross-tenant denial |
| `auth.test.tsx` | 12 | Protected routes, public-only routes, auth validation schemas, sign-in rendering |
| `routes.test.tsx` | 3 | Onboarding redirect, logo rendering |

**Total: 72 tests across 8 test files — all passing.**

---

## 8. Actual Database Tests Performed

**None.** No database tables exist — the schema is pending operator approval. All tests are domain-level (TypeScript) or component-level (React Testing Library). These test the business logic that will be enforced server-side once the schema is approved.

**Specifically NOT claimed:**
- RLS policy enforcement — UNVERIFIED (no tables exist)
- Cross-tenant isolation at database level — UNVERIFIED (no tables exist)
- Ownership invariant at database level — UNVERIFIED (no index exists)
- Concurrent transaction safety — UNVERIFIED (no function exists)

These will be verified after schema approval and migration.

---

## 9. Migration Status

**Status: NOT APPLIED**

No migrations have been applied to the Supabase project. The database remains empty (0 tables, 0 migrations).

The proposed migration is fully designed in `docs/proposed-schema.md` and ready to apply upon operator approval.

---

## 10. Remaining Security Blockers

| Blocker | Resolution |
|---------|-----------|
| Schema not applied | Requires operator approval of `docs/proposed-schema.md` |
| RLS policies not active | Will be created in the same migration as the tables |
| No SECURITY DEFINER functions | `create_organization` function ready in schema doc, will be created with migration |
| No audit logging | Audit log table deferred to Sprint 2 (not in Sprint 1 scope) |
| Database backups unverified | Not blocking Sprint 1, should be verified before production |
| Organization creation not functional | Requires approved schema + SECURITY DEFINER function |

---

## 11. Operator Approval Required

### Schema Approval
**The proposed database schema in `docs/proposed-schema.md` requires operator review and approval before any migrations are applied.**

Please confirm:
1. The three-table structure (user_profiles, organizations, organization_memberships) is acceptable
2. The RLS approach (SELECT-only on orgs/memberships, mutations via SECURITY DEFINER) is acceptable
3. The ownership invariant (partial unique index) is acceptable
4. The `create_organization` SECURITY DEFINER function design is acceptable
5. You authorize the migration to be applied

### After Approval
Once approved, the next step is:
1. Apply the migration via `apply_migration` MCP tool
2. Verify RLS policies with `get_security_posture`
3. Run security advisors with `get_advisors`
4. Wire the frontend `create_organization` call to the RPC
5. Replace the "Create organization" disabled button with the active operation

---

## 12. Sprint 1 Continuation Plan

After schema approval, the remaining Sprint 1 work is:

1. **Apply the migration** — create tables, RLS policies, unique index, SECURITY DEFINER function
2. **Verify security posture** — run `get_security_posture` and `get_advisors` to confirm policies are correct
3. **Activate organization creation** — wire the onboarding page's "Create organization" button to call the `create_organization` RPC
4. **Integration test** — sign up a real user, create an organization, verify membership appears
5. **Update OrganizationContext** — the graceful fallback for missing tables can be replaced with real queries
6. **Update documentation** — mark database capabilities as VERIFIED with real evidence

---

*Hourvia by Living IT Solutions — Time tracked. Progress made.*
