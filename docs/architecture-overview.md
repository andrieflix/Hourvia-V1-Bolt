# Hourvia — Architecture Overview

## Product

- **Name:** Hourvia
- **Full brand:** Hourvia by Living IT Solutions
- **Tagline:** Time tracked. Progress made.
- **Type:** Organization-first, multi-tenant workforce time-tracking SaaS

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Build tool | Vite | 5.4.x |
| Language | TypeScript (strict mode) | 5.6.x |
| Styling | Tailwind CSS | 3.4.x |
| Routing | React Router | 6.26.x |
| Validation | Zod | 3.23.x |
| Icons | Lucide React | 0.451.x |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) | Provisioned |
| Testing | Vitest + Testing Library | 2.1.x / 16.x |
| Linting | ESLint + TypeScript ESLint | 9.x / 8.x |

## Architecture Layers

### 1. Domain Layer (`src/domain/`)
Pure TypeScript types, rules, and calculations with zero dependencies on infrastructure or UI:
- `types.ts` — User, Organization, Membership, Invitation, Role, OrganizationContext
- `permissions.ts` — Role-permission matrix, role management rules, hierarchy checks
- `organization.ts` — Ownership transfer validation, membership revocation, org switching, single-owner invariant
- `time.ts` — Duration conversions (ms ↔ hours), formatting, week range, UTC date formatting
- `money.ts` — Minor-unit money arithmetic, currency formatting

### 2. Application / Use Case Layer
Coordinates domain rules with UI state. Currently minimal — will grow in Sprint 1:
- Auth context (Sprint 1)
- Organization context (Sprint 1)

### 3. Infrastructure / Persistence Layer
Supabase adapter. Not yet activated in Sprint 0. Will handle:
- Supabase client singleton (`@supabase/supabase-js`)
- Database queries with RLS
- Edge functions for privileged operations
- Auth session management

### 4. UI / Presentation Layer (`src/components/`, `src/pages/`)
React components with Tailwind styling:
- `components/ui/` — Reusable primitives (Button, Input, Card, Badge, Logo, ThemeSelector)
- `components/layout/` — App shell (Sidebar, TopNav, Breadcrumbs, OrgSelector, UserMenu)
- `pages/public/` — Landing, About
- `pages/auth/` — SignIn, SignUp, ForgotPassword (UI-only)
- `pages/app/` — Dashboard, preview pages

### 5. Auth / Authorization Boundary
- Authentication: UI-only in Sprint 0. Supabase email/password auth will be activated in Sprint 1.
- Authorization: Domain-level permission contracts defined but not yet enforced server-side.
- Server authorization must never trust client-selected roles.

## Design System

### Colors
- **Primary:** Teal (#0d9d9d) — CTAs, active states, accents
- **Foundation:** Deep navy/charcoal (#0d1521) — sidebar, dark mode base
- **Accent:** Electric blue (#3366ff) — secondary accents
- **Status:** Success (green), Warning (amber), Error (red)
- **Neutrals:** Navy ramp (50–950) for text, borders, surfaces

### Typography
- Primary: Inter (400, 500, 600, 700)
- Mono: JetBrains Mono (400, 500)
- Body line-height: 150%, Headings: 120%

### Theme
- Light, dark, and system themes
- CSS custom properties for theme tokens
- `class` strategy on `<html>` element
- Persisted to localStorage

### Spacing
- 8px base unit with extended scale (18, 88)

## Organization and Role Contracts

### Roles (hierarchy high → low)
1. OWNER — full control including delete and ownership transfer
2. ADMIN — all management except delete and ownership transfer
3. MANAGER — team management, approvals, projects, clients
4. EMPLOYEE — own time tracking, attendance, reports
5. CONTRACTOR — same as EMPLOYEE

### Rules (contracts for Sprint 0)
- Every organization must have exactly one active OWNER
- Users may belong to multiple organizations
- Organization switching must not grant additional permissions
- Server authorization must never trust client-selected roles
- Organization ownership transfer must be atomic
- Membership revocation must invalidate access
- Cross-organization access must be denied

## Data Design Principles

- **UTC timestamps** — all time stored in UTC
- **Integer durations** — milliseconds as `bigint` or `integer` in DB, `number` in app
- **Money** — integer minor units (cents), never floating-point
- **Tenant isolation** — organization-scoped records with RLS
- **Idempotency** — designed for reliable concurrent operations
- **Audit** — sensitive operations will be auditable

## Route Map

### Public
- `/` — Landing page
- `/about` — About page

### Auth (UI-only)
- `/signin` — Sign in
- `/signup` — Sign up
- `/forgot-password` — Password reset request

### Application (authenticated)
- `/app` — Dashboard (overview with synthetic data)
- `/app/time-tracker` — Preview
- `/app/attendance` — Preview
- `/app/timesheets` — Preview
- `/app/team` — Preview
- `/app/projects` — Preview
- `/app/clients` — Preview
- `/app/billing` — Preview
- `/app/reports` — Preview
- `/app/settings` — Preview

## Security Architecture

- No hardcoded secrets
- No credentials in browser bundles
- No client-side authorization as sole enforcement
- No real authentication bypass
- No production data mutations in Sprint 0
- No covert employee monitoring
- No payroll or payment processing
- Supabase RLS will be the primary tenant isolation mechanism (Sprint 1+)
- Edge functions for privileged server-side operations (Sprint 1+)
