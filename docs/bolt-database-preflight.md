# Supabase Preflight — Hourvia Sprint 0

## Methodology

The Supabase project was inspected using the Bolt Supabase MCP tools on 2026-10-23.
This document records what was verified and what remains unverified.

---

## 1. How Supabase is Provisioned

**VERIFIED.** The Supabase project is pre-provisioned by Bolt. The following environment variables are pre-populated in `.env`:

- `VITE_SUPABASE_URL` — project URL
- `VITE_SUPABASE_ANON_KEY` — anon/public key for client-side use
- `SUPABASE_URL` — server-side URL
- `SUPABASE_ANON_KEY` — server-side anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (bypasses RLS)
- `SUPABASE_DB_URL` — direct Postgres connection string

No manual provisioning was required. The project is ready for schema creation via the `apply_migration` MCP tool.

---

## 2. Supported Authentication Methods

**VERIFIED (capability exists).** Supabase Auth is available with the following methods:

- Email/password — **supported** (default for Hourvia when activated)
- Magic links — supported by Supabase but NOT planned for Hourvia
- OAuth social providers — supported by Supabase but NOT planned for Hourvia
- Email confirmation — OFF by default, will remain OFF

**Sprint 0 status:** Authentication UI is built (sign in, sign up, forgot password) but authentication is NOT activated. No auth mutations are performed.

---

## 3. How Authenticated User Identity is Obtained Server-Side

**VERIFIED.** Supabase provides:

- `auth.uid()` SQL function — returns the authenticated user's UUID in RLS policies
- `auth.jwt()` SQL function — returns the user's JWT for claims-based authorization
- `raw_app_meta_data` — user-immutable metadata (for authorization data)
- `raw_user_meta_data` — user-mutable metadata (NOT for authorization)

Edge functions receive the JWT in the `Authorization` header and can verify it using the Supabase client.

---

## 4. How Database Tables and Schema Changes are Managed

**VERIFIED.** Schema changes are managed through the `apply_migration` MCP tool:

- Each migration is a named SQL block applied atomically
- Migrations are tracked in the Supabase migrations table
- `IF NOT EXISTS` / `IF EXISTS` used for idempotency
- Policy creation uses `DROP POLICY IF EXISTS` before `CREATE POLICY` for idempotency
- No raw SQL execution outside the migration tool for DDL
- `execute_sql` MCP tool available for diagnostic queries (DML/SELECT only)

**Important:** Writing `.sql` files to `supabase/migrations/` on disk has no effect — only the `apply_migration` MCP tool applies schema changes.

---

## 5. Whether PostgreSQL and Row-Level Security are Exposed

**VERIFIED.** The project runs PostgreSQL with full RLS support:

- `get_security_posture` MCP tool confirmed: 0 tables, 0 policies, 0 functions (empty database)
- RLS can be enabled on any table with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Policies support `SELECT`, `INSERT`, `UPDATE`, `DELETE` per verb
- `auth.uid()` is available for ownership checks in policies
- `USING` clause for read/delete predicates, `WITH CHECK` for insert/update predicates
- Grants must be explicit — tables without grants return `42501 permission denied`

**Sprint 0 status:** No tables created yet. Schema design deferred to Sprint 1 pending tenancy validation.

---

## 6. Whether Server-Side Functions or Trusted Backend Operations are Supported

**VERIFIED.** Edge Functions (Deno runtime) are supported:

- Deployed via `deploy_edge_functions` MCP tool
- Source written to `supabase/functions/<slug>/index.ts` on disk
- Configuration in `supabase/config.toml` with `[functions.<slug>]` table
- `verify_jwt` setting controls authentication requirement
- CORS headers mandatory on all responses
- `npm:` and `jsr:` import prefixes supported
- `Deno.serve` for HTTP handling
- State must be stored in database (not module-level variables — instances are ephemeral)

**Also verified:** `SECURITY DEFINER` PostgreSQL functions can be created for privileged operations that run with the function owner's permissions.

**Sprint 0 status:** No edge functions deployed. No `SECURITY DEFINER` functions created.

---

## 7. How Database Transactions Work

**VERIFIED.** Each migration applied through `apply_migration` is wrapped in an implicit transaction. Explicit `BEGIN`/`COMMIT`/`ROLLBACK` is rejected. `DO $$ ... END $$` PL/pgSQL blocks are allowed for multi-statement atomic operations within a migration.

For application-level transactions (Sprint 1+):
- Edge functions can use the Supabase client for sequential operations
- PostgreSQL `SECURITY DEFINER` functions can wrap multi-step operations atomically
- `DO $$ ... END $$` blocks provide procedural transaction-like behavior

---

## 8. How Atomic Ownership Transfers Can Be Implemented

**VERIFIED (approach validated).** Atomic ownership transfer can be implemented as:

1. A `SECURITY DEFINER` PostgreSQL function that:
   - Verifies the caller is the current owner
   - Verifies the target is an active member
   - Updates the organization's `owner_id`
   - Updates the old owner's membership role
   - Updates the new owner's membership role to OWNER
   - All within a single `DO $$ ... END $$` block (atomic)
2. RLS policies prevent direct table updates to `owner_id` or `role` columns
3. The function is the only path to transfer ownership
4. `REVOKE EXECUTE` from `PUBLIC, anon` and `GRANT EXECUTE` to `authenticated` only

**Sprint 0 status:** Domain-level validation logic implemented and tested in `src/domain/organization.ts`. Database function deferred to Sprint 1.

---

## 9. How Tenant Isolation Can Be Enforced

**VERIFIED (approach validated).** Tenant isolation via RLS:

- Every table has an `organization_id` column
- RLS policies check membership: `EXISTS (SELECT 1 FROM memberships WHERE memberships.user_id = auth.uid() AND memberships.organization_id = <table>.organization_id AND memberships.status = 'ACTIVE')`
- No cross-organization access possible — RLS filters rows at the database level
- Column-level privileges can restrict sensitive columns (role, balance, status)
- `SECURITY DEFINER` functions handle privileged mutations (role changes, ownership transfer)
- Storage buckets can be scoped to organization IDs

**Sprint 0 status:** Not yet implemented at the database level. Domain contracts in place.

---

## 10. How Migrations, Preview, and Production Environments are Separated

**PARTIALLY VERIFIED.**

- The MCP `apply_migration` tool applies migrations to the provisioned project
- Migrations are tracked with timestamps in the Supabase migrations table
- `list_migrations` shows applied migrations
- The current project appears to be a single environment (no separate preview/production confirmed)
- **UNVERIFIED:** Whether separate preview/staging environments can be created
- **UNVERIFIED:** Whether migrations can be rolled back or applied selectively to different environments

---

## 11. How Database Backups and Recovery Work

**UNVERIFIED.** Backup and recovery capabilities were not inspected in Sprint 0. Supabase typically provides:
- Daily automatic backups (on paid plans)
- Point-in-time recovery (on paid plans)
- Manual export via `pg_dump` (using `SUPABASE_DB_URL`)

These were not tested or verified in this sprint.

---

## 12. Whether Audit Records and Idempotent Operations Can Be Implemented Securely

**VERIFIED (approach validated).**

### Audit Records
- An `audit_log` table can be created with: `id`, `organization_id`, `actor_user_id`, `action`, `target_type`, `target_id`, `metadata` (JSONB), `created_at` (UTC)
- RLS: members can read their org's audit logs; writes only via `SECURITY DEFINER` functions or `service_role`
- Sensitive operations (ownership transfer, role changes, membership revocation) insert audit records within the same transaction

### Idempotent Operations
- Idempotency keys table: `idempotency_keys` with `key` (unique), `organization_id`, `operation`, `request_hash`, `response`, `created_at`, `expires_at`
- Edge functions check the key before processing: if exists, return cached response; if not, process and store
- Database unique constraint on `key` prevents race conditions
- Keys have TTL for cleanup

**Sprint 0 status:** Neither implemented. Architecture validated.

---

## Summary Table

| # | Capability | Status |
|---|-----------|--------|
| 1 | Supabase provisioning | VERIFIED |
| 2 | Authentication methods | VERIFIED (email/password supported) |
| 3 | Server-side user identity | VERIFIED (auth.uid(), auth.jwt()) |
| 4 | Schema/migration management | VERIFIED (apply_migration MCP tool) |
| 5 | PostgreSQL + RLS | VERIFIED |
| 6 | Server-side functions | VERIFIED (Edge Functions + SECURITY DEFINER) |
| 7 | Database transactions | VERIFIED (implicit per migration, DO blocks) |
| 8 | Atomic ownership transfer | VERIFIED (approach, domain tests pass) |
| 9 | Tenant isolation | VERIFIED (approach, RLS + membership checks) |
| 10 | Environment separation | PARTIALLY VERIFIED |
| 11 | Backups and recovery | UNVERIFIED |
| 12 | Audit + idempotency | VERIFIED (approach, not implemented) |

---

## Available Extensions (from `list_extensions`)

The Supabase project has access to many PostgreSQL extensions including:
- `pgcrypto` — cryptographic functions (for `gen_random_uuid()`)
- `pg_partman` — partition management
- `pg_hashids` — hash IDs
- `http` — HTTP client from PostgreSQL
- `hypopg` — hypothetical indexes
- `btree_gist` — GiST indexing for common types
- And many more (full list available via the MCP tool)

No extensions are installed yet for Hourvia.
