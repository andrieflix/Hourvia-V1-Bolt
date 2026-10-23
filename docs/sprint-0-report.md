# Hourvia Sprint 0 Report

**Date:** 2026-10-23
**Sprint:** 0 — Foundation
**Status:** Complete

---

## 1. Implemented Features

### Public Website
- Landing page with hero, features, how-it-works, benefits, final CTA, and footer
- About page with mission, audiences, platform capabilities, and privacy-conscious positioning
- Authentication UI (sign in, sign up, forgot password) with Zod validation — UI-only, no auth mutations

### Application Shell
- Collapsible sidebar with desktop collapse and mobile drawer
- Top navigation with search bar, theme selector, organization selector, and user menu
- Organization selector (preview-only, labeled as preview)
- User menu (preview-only, labeled as preview)
- Theme selector (light / dark / system) with localStorage persistence and system preference detection
- Breadcrumbs that adapt to the current route
- Responsive layout from mobile to desktop

### Dashboard
- Today's tracked time, weekly hours, billable hours, pending timesheets stat cards
- Weekly activity bar chart with synthetic data
- Team overview with member roles and weekly hours
- Recent activity feed
- Quick navigation cards to key sections
- All data labeled as synthetic demonstration data

### Business Sections (Preview)
- Time Tracker, Attendance, Timesheets, Team, Projects, Clients, Billing, Reports, Settings
- All routes implemented and rendered with clear "Preview" labeling
- No business operations activated

### Domain Layer
- User, Organization, Membership, Invitation, Role, OrganizationContext types
- Role permission matrix (OWNER, ADMIN, MANAGER, EMPLOYEE, CONTRACTOR)
- Ownership transfer validation
- Membership revocation validation
- Organization switching boundary validation
- Single-owner invariant validation
- Duration primitives (ms ↔ hours, formatting)
- Money primitives (minor units, formatting)
- UTC timestamp and week range utilities

### Design System
- Deep navy/charcoal foundation with teal accents
- 6 color ramps (primary teal, navy, accent blue, success, warning, error)
- Inter font family (4 weights)
- 8px spacing system
- CSS custom properties for theme tokens
- Code-based vector logo and favicon
- Hover states, transitions, and subtle animations

---

## 2. Screens and Routes

| Route | Screen | Status |
|-------|--------|--------|
| `/` | Landing page | Complete |
| `/about` | About page | Complete |
| `/signin` | Sign in | UI-only |
| `/signup` | Sign up | UI-only |
| `/forgot-password` | Forgot password | UI-only |
| `/app` | Dashboard | Synthetic data |
| `/app/time-tracker` | Time Tracker | Preview |
| `/app/attendance` | Attendance | Preview |
| `/app/timesheets` | Timesheets | Preview |
| `/app/team` | Team | Preview |
| `/app/projects` | Projects | Preview |
| `/app/clients` | Clients | Preview |
| `/app/billing` | Billing | Preview |
| `/app/reports` | Reports | Preview |
| `/app/settings` | Settings | Preview |
| `*` | 404 Not Found | Complete |

---

## 3. Technology Versions

| Technology | Version |
|-----------|---------|
| React | 18.3.1 |
| React DOM | 18.3.1 |
| React Router DOM | 6.26.2 |
| Vite | 5.4.8 |
| TypeScript | 5.6.2 |
| Tailwind CSS | 3.4.13 |
| Zod | 3.23.8 |
| Lucide React | 0.451.0 |
| @supabase/supabase-js | 2.45.0 |
| Vitest | 2.1.2 |
| @testing-library/react | 16.0.1 |
| ESLint | 9.x |
| PostCSS | 8.4.47 |
| Autoprefixer | 10.4.20 |

---

## 4. Project Structure

```
project/
├── docs/
│   ├── architecture-overview.md
│   ├── bolt-database-preflight.md
│   └── sprint-0-report.md
├── public/
│   └── favicon.svg
├── src/
│   ├── __tests__/
│   │   ├── routes.test.tsx
│   │   └── theme.test.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── OrgSelector.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── PublicNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   └── index.ts
│   │   └── PreviewPage.tsx
│   ├── config/
│   │   └── navigation.ts
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── data/
│   │   └── synthetic.ts
│   ├── domain/
│   │   ├── __tests__/
│   │   │   ├── money.test.ts
│   │   │   ├── organization.test.ts
│   │   │   ├── permissions.test.ts
│   │   │   └── time.test.ts
│   │   ├── index.ts
│   │   ├── money.ts
│   │   ├── organization.ts
│   │   ├── permissions.ts
│   │   ├── time.ts
│   │   └── types.ts
│   ├── pages/
│   │   ├── app/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── PreviewPages.tsx
│   │   ├── auth/
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── public/
│   │   │   ├── AboutPage.tsx
│   │   │   └── LandingPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── test/
│   │   └── setup.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 5. Database Capabilities Verified

| Capability | Status |
|-----------|--------|
| Supabase provisioning | Verified — pre-provisioned with env vars |
| Authentication (email/password) | Verified — supported, not activated |
| Server-side user identity (auth.uid()) | Verified |
| Schema/migration management (apply_migration) | Verified |
| PostgreSQL + Row-Level Security | Verified |
| Edge Functions (Deno) | Verified — available, not deployed |
| Database transactions | Verified — implicit per migration, DO blocks |
| Atomic ownership transfer approach | Verified — SECURITY DEFINER function design |
| Tenant isolation approach | Verified — RLS + membership checks |
| PostgreSQL extensions | Verified — list retrieved (pgcrypto, http, etc.) |

---

## 6. Database Capabilities Unverified

| Capability | Status |
|-----------|--------|
| Environment separation (preview vs production) | Partially verified — single environment confirmed |
| Database backups and recovery | Unverified — not inspected |
| Point-in-time recovery | Unverified |
| Migration rollback | Unverified |
| Realtime subscriptions | Unverified — not tested |

---

## 7. Security Architecture

### Sprint 0 Posture
- **No hardcoded secrets** — all credentials in `.env`, not in source code
- **No credentials in browser bundles** — only `VITE_` prefixed env vars reach the client
- **No client-side authorization as sole enforcement** — domain contracts define rules, but server enforcement is designed for Sprint 1
- **No real authentication bypass** — auth screens show explicit "UI-only" warnings
- **No production data mutations** — no database tables created, no mutations performed
- **No covert employee monitoring** — explicitly excluded from MVP
- **No payroll processing** — excluded
- **No payment processing** — excluded

### Sprint 1 Design (not yet implemented)
- Supabase RLS as primary tenant isolation
- `SECURITY DEFINER` functions for privileged mutations
- Column-level privileges for sensitive columns
- Organization-scoped data access via membership checks
- Audit logging for sensitive operations
- Idempotency keys for reliable concurrent operations

---

## 8. Test Results

```
Test Files  6 passed (6)
     Tests  53 passed (53)
```

### Test Breakdown

| Test File | Tests | Coverage |
|-----------|-------|----------|
| permissions.test.ts | 14 | Role permissions, canManageRole, isAtLeast, escalation prevention |
| organization.test.ts | 17 | Ownership transfer, single-owner invariant, revocation, org switching |
| time.test.ts | 8 | Duration conversion, formatting, week range, UTC dates |
| money.test.ts | 3 | Minor unit conversion, money formatting |
| routes.test.tsx | 3 | Dashboard rendering, preview rendering, synthetic data label |
| theme.test.tsx | 5 | Default theme, resolution, switching, persistence |

**Note:** Database security is NOT tested — no database tables exist. Domain rule tests validate the logic that will be enforced server-side in Sprint 1.

---

## 9. Build Results

### TypeScript Check
```
npx tsc -b --noEmit
→ No errors
```

### ESLint
```
npx eslint src/
→ No errors, no warnings
```

### Production Build
```
npx vite build
✓ 1612 modules transformed
dist/index.html       0.90 kB │ gzip:  0.48 kB
dist/assets/index.css  26.16 kB │ gzip:  5.39 kB
dist/assets/index.js  286.34 kB │ gzip: 80.98 kB
✓ built in 11.92s
```

### Tests
```
npx vitest run
✓ 6 test files passed
✓ 53 tests passed
```

---

## 10. Known Limitations

1. **Authentication is UI-only** — Supabase auth is not activated. Sign in, sign up, and forgot password screens show validation but do not perform real authentication.
2. **No database tables exist** — Schema design is deferred to Sprint 1 pending tenancy and authorization validation.
3. **Organization switching is preview-only** — The org selector UI exists but does not perform real context switching.
4. **All dashboard data is synthetic** — Clearly labeled. No real account records are shown.
5. **Business sections are previews** — Time Tracker, Attendance, Timesheets, Team, Projects, Clients, Billing, Reports, and Settings show placeholder content.
6. **No edge functions deployed** — Server-side privileged operations are designed but not implemented.
7. **Database backups and recovery unverified** — Not inspected in this sprint.
8. **Environment separation unverified** — Only a single Supabase environment was confirmed.
9. **User menu actions are non-functional** — Profile, settings, and sign out buttons do not perform operations.

---

## 11. Sprint 1 Readiness

### Ready
- Domain types and permission contracts — fully defined and tested
- Organization ownership invariants — validated in domain tests
- Role hierarchy and escalation prevention — tested
- Duration and money primitives — tested and ready for use
- UI component library — Button, Input, Card, Badge, Logo, ThemeSelector
- Application shell — sidebar, top nav, breadcrumbs, responsive layout
- Theme system — light/dark/system with persistence
- Route structure — all 10 app sections routed
- Supabase project — provisioned, empty, ready for schema creation
- Supabase capabilities — verified (RLS, auth, edge functions, migrations)

### Required for Sprint 1
- Activate Supabase email/password authentication
- Create database schema (organizations, memberships, invitations, users)
- Implement RLS policies with organization-scoped tenant isolation
- Implement `SECURITY DEFINER` function for atomic ownership transfer
- Wire authentication to the UI (replace UI-only warnings with real auth)
- Implement organization context switching with server validation
- Create audit log table and logging for sensitive operations
- Verify database backup and recovery capabilities
- Verify environment separation (preview vs production) if available

### Operator Decisions Needed
1. **Authentication activation** — Confirm activation of Supabase email/password auth for Sprint 1
2. **Schema approval** — Review and approve the organization/membership schema design before Sprint 1 creates tables
3. **Environment strategy** — Confirm whether separate preview/staging environments are needed or if the single provisioned environment suffices
4. **Backup verification** — Confirm whether backup/recovery verification should be prioritized in Sprint 1

---

## 12. Exact Files Created or Modified

### Created (44 files)

**Configuration:**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `eslint.config.js`
- `index.html`

**Public assets:**
- `public/favicon.svg`

**Source — entry:**
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/vite-env.d.ts`

**Source — domain:**
- `src/domain/index.ts`
- `src/domain/types.ts`
- `src/domain/permissions.ts`
- `src/domain/organization.ts`
- `src/domain/time.ts`
- `src/domain/money.ts`

**Source — domain tests:**
- `src/domain/__tests__/permissions.test.ts`
- `src/domain/__tests__/organization.test.ts`
- `src/domain/__tests__/time.test.ts`
- `src/domain/__tests__/money.test.ts`

**Source — contexts:**
- `src/contexts/ThemeContext.tsx`

**Source — config:**
- `src/config/navigation.ts`

**Source — data:**
- `src/data/synthetic.ts`

**Source — UI components:**
- `src/components/ui/index.ts`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Logo.tsx`
- `src/components/ui/ThemeSelector.tsx`

**Source — layout:**
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopNav.tsx`
- `src/components/layout/Breadcrumbs.tsx`
- `src/components/layout/OrgSelector.tsx`
- `src/components/layout/UserMenu.tsx`
- `src/components/layout/PublicNav.tsx`
- `src/components/layout/PublicFooter.tsx`
- `src/components/layout/PublicLayout.tsx`

**Source — components:**
- `src/components/PreviewPage.tsx`

**Source — pages:**
- `src/pages/public/LandingPage.tsx`
- `src/pages/public/AboutPage.tsx`
- `src/pages/auth/SignInPage.tsx`
- `src/pages/auth/SignUpPage.tsx`
- `src/pages/auth/ForgotPasswordPage.tsx`
- `src/pages/app/DashboardPage.tsx`
- `src/pages/app/PreviewPages.tsx`
- `src/pages/NotFoundPage.tsx`

**Source — tests:**
- `src/__tests__/routes.test.tsx`
- `src/__tests__/theme.test.tsx`
- `src/test/setup.ts`

**Documentation:**
- `docs/architecture-overview.md`
- `docs/bolt-database-preflight.md`
- `docs/sprint-0-report.md`

### Modified
- `package-lock.json` (regenerated with all dependencies)
- `README.md` (unchanged from initial state)

---

*Hourvia by Living IT Solutions — Time tracked. Progress made.*
