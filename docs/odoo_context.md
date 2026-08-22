# HRMS4ODOO — Build Context

Last updated: 2026-08-22 (note: generated via audit, not hand-written — this is the second pass, after a `git pull` and an auth-wiring fix)

## Phase Status

| Phase | Name | Status | Notes | Files involved |
|---|---|---|---|---|
| 1 | Supabase Project Setup | **Done** | `client.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; both names match `.env.example` exactly. No other file in `src` references a differently-named env var. | `src/lib/supabase/client.ts`, `.env.example` |
| 2 | Database Migration | **Done** | All 7 required tables (`profiles`, `employees`, `attendance_records`, `leave_types`, `leave_requests`, `leave_approvals`, `salary_structures`) are now confirmed **live on the remote Supabase database** — verified via direct REST calls (all return `200`) and `npx supabase migration list` showing every local migration's timestamp matched on the remote. The duplicate-`CREATE TABLE`/duplicate-policy conflict from earlier passes was resolved by stripping `auth_setup.sql` down to only `handle_new_user()`/its trigger; a `LANGUAGE sql` ordering hazard in `is_admin()` (found and fixed this pass) is also resolved. See the dated section below for full detail. | `supabase/migrations/20250101000000_auth_setup.sql`, `20260822060408_initial_dayflow_schema.sql`, `20260822060409_create_employee_rpc.sql`, `20260822060410_seed_leave_types.sql` |
| 3 | Triggers + Indexes | **Done** (structurally) | All 5 `updated_at` triggers (`profiles_set_updated_at`, `employees_set_updated_at`, `attendance_set_updated_at`, `leave_requests_set_updated_at`, `salary_structures_set_updated_at`) and all 8 indexes exist and are correctly wired to `public.set_updated_at()`. Caveat: every `CREATE TRIGGER` / `CREATE INDEX` in the file is non-idempotent (no `OR REPLACE` / `IF NOT EXISTS`), so re-running the migration errors out. | `supabase/migrations/20260822060408_initial_dayflow_schema.sql` |
| 4 | RLS | **Done** | RLS is now confirmed **enabled on all 7 tables on the live remote database** — verified by directly querying `pg_class.relrowsecurity` via `supabase db query --linked` (all 7 returned `true`), not just inferred from migration file text. Anonymous (publishable-key) REST requests against all 7 tables correctly return `200` with an empty array, consistent with every policy being scoped `TO authenticated`. The duplicate/conflicting policy names (`profiles_update_own`, `employees_select_own_or_admin`) are resolved — `auth_setup.sql` no longer defines any policies; the dayflow schema file's versions are the only ones that exist. | `supabase/migrations/20260822060408_initial_dayflow_schema.sql` |
| 5 | Supabase Auth | **Done** | All 8 required functions exist and are implemented (not stubs): `signUp`, `signIn`, `getSession`, `getCurrentUser`, `signOut`, `requestPasswordReset`, `updatePassword` (all in `auth.service.ts`), and `onAuthStateChange` (in `lib/supabase/auth.ts`). `signUp()` never accepts or forwards a `role` field from the caller — role can only come from the DB trigger, as required. **Now wired into the running app**: `App.tsx` imports `AuthProvider` from the real, Supabase-backed `AuthContext.tsx` (it was previously importing a mock/`localStorage` implementation from `auth-context.tsx` — that file still exists, unused, per instruction not to delete it). `ProtectedRoute.tsx`/`RoleRoute.tsx` were rewritten from a `children`-prop API to the `<Outlet/>`-based API `App.tsx`'s router actually uses (they were non-functional stubs before — using them as originally written would have rendered nothing for every authenticated route), and a `GuestRoute` was added since no real-auth equivalent existed. `LoginPage.tsx`'s post-login redirect was fixed (it pointed at `/admin`/`/employee`, routes that don't exist — now uses `paths.dashboard` / the original `from` location). A `/signup` route was registered pointing at `SignupPage.tsx`, which wasn't reachable before. Two error-handling gaps in `AuthContext.tsx` (`refreshUser()` and the init effect discarding Supabase errors) were fixed to route through `mapSupabaseError`, now exported from `auth.service.ts`. **Caveat:** `LoginPage.tsx`/`SignupPage.tsx` are bare, unstyled HTML forms (no `AuthLayout`, no design-system components) — visibly different from, and less polished than, the mock `sign-in.tsx` UI they replaced in the live tree. Left as-is; restyling wasn't part of the wiring fix. | `src/features/auth/AuthContext.tsx` (live), `src/features/auth/auth.service.ts`, `src/lib/supabase/auth.ts`, `src/routes/ProtectedRoute.tsx` + `RoleRoute.tsx` (live, rewritten), `src/pages/auth/LoginPage.tsx` + `SignupPage.tsx` (live), `src/App.tsx`, `src/routes/paths.ts`. Mock stack retained but unused: `auth-context.tsx`, `sign-in.tsx`, `protected-route.tsx` |
| 6 | Profile Backend | **Done** | `getMyProfile()` and `updateMyProfile()` now exist in `src/features/profile/profile.service.ts` (plus a `useProfile()` hook in `src/features/profile/useProfile.ts`), added since the last audit pass. Both are fully implemented, not stubs. `updateMyProfile()` correctly allowlists — it builds its update payload field-by-field (`if (input.phone !== undefined) payload.phone = ...`) restricted to exactly `phone`, `address`, `profile_picture_url`; it does not spread or pass through the input object, so `role`/`is_active`/`employee_code`/`employment_status`/`profile_id` cannot be sent even if a caller tried. No allowlist bug found — no fix was needed. Follows the same `{ data, error }` `ServiceResult<T>` shape as `auth.service.ts`. Not yet wired into the router: `src/pages/employee/MyProfilePage.tsx` consumes `useProfile()` correctly but isn't imported by `App.tsx`, so it's not reachable by any URL yet — noted as fact, not fixed (out of scope for this pass). | `src/features/profile/profile.service.ts`, `src/features/profile/useProfile.ts`, `src/pages/employee/MyProfilePage.tsx` (unrouted) |

## Known Issues / Open Risks

**Unresolved migration conflict (blocker) — still open.** `supabase/migrations/20250101000000_auth_setup.sql` and `supabase/migrations/20260822060408_initial_dayflow_schema.sql` both issue a bare `CREATE TABLE public.profiles` and `CREATE TABLE public.employees`, with different column constraints, and both define RLS policies named `profiles_update_own` and `employees_select_own_or_admin` with different `USING`/`WITH CHECK` logic. Both also independently `CREATE OR REPLACE FUNCTION public.is_admin()` — that one is *not* blocking, since `OR REPLACE` makes it idempotent and the two definitions are functionally identical (only clause ordering differs). Applying both files in order to a fresh database still fails on the second file's `CREATE TABLE public.profiles`. This is a decision for whoever owns Phase 2/4 — not something fixed automatically. See the full side-by-side object comparison delivered separately in this pass's audit.

**Non-idempotent DDL — unchanged.** Every `CREATE TRIGGER`, `CREATE INDEX`, `CREATE POLICY`, and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statement in the migration files is written in its plain, non-idempotent form (no `OR REPLACE`, `IF NOT EXISTS`). Re-running any of them against a database where they already ran will error.

**Auth wiring — fixed this pass.** `App.tsx` now imports the real, Supabase-backed `AuthContext.tsx` instead of the mock `auth-context.tsx`. `ProtectedRoute.tsx`/`RoleRoute.tsx` were rewritten to the `<Outlet/>` pattern the router actually uses (as written before, they used an incompatible `children`-prop API and would have rendered blank content for every authenticated page). A `GuestRoute` was added to `ProtectedRoute.tsx` since no real-auth equivalent existed at all. See Phase 5 above for full detail. The mock stack (`auth-context.tsx`, `sign-in.tsx`, `protected-route.tsx`, `src/lib/mock/*`) is left in place but unused, per instruction.

**New, visible caveat from the auth-wiring fix: unstyled login/signup UI.** `LoginPage.tsx` and `SignupPage.tsx` (now live) are bare HTML forms with no styling, no `AuthLayout` wrapper, and none of the design-system components (`Input`, `Button`, password-visibility toggle, etc.) that the previous mock `sign-in.tsx` had. This is a real, visible regression in the sign-in/sign-up experience versus what was live before. Not fixed in this pass — restyling is a design decision, not a wiring fix, and wasn't requested.

**Duplicate type-definition sources — unchanged.** `src/types/index.ts` and `src/types/domain.ts` both independently model the same 7 DB tables. They still agree column-for-column with the migration schema, but there is no single source of truth.

**Error-handling gap in the auth context — fixed this pass.** `refreshUser()` and the init effect in `AuthContext.tsx` previously discarded the `error` from `supabase.auth.getUser()`/`getSession()`. Both now capture `error` and route it through `mapSupabaseError` (now exported from `auth.service.ts`), logged via `console.error`. See the audit transcript for the exact before/after.

**Signup route — fixed this pass.** `paths.ts` now has a `signUp` entry (`/signup`), and `App.tsx` registers a route rendering `SignupPage.tsx` inside the guest-route group.

**Phase 6 — built since the last pass, no bug found.** `getMyProfile()`/`updateMyProfile()` now exist and correctly allowlist their update fields. See Phase 6 above. Not yet routed/reachable in the UI, but that wasn't part of this pass's scope.

**Corrected finding: the previous "`tsc --noEmit` is clean" claim was a false negative.** Plain `npx tsc --noEmit` at the repo root silently checks *nothing*, because the root `tsconfig.json` has `"files": []` (it's just a project-references pointer, standard for Vite scaffolds — nothing was misconfigured). The correct invocation is `npx tsc --noEmit -p tsconfig.app.json` (or `npm run build`, which uses `tsc -b` and respects the references properly). Run correctly, it reveals **25 pre-existing TypeScript errors — all caused by 3 missing dependencies** (`date-fns`, `react-day-picker`, `framer-motion`) that are imported throughout the app (dashboards, attendance pages, `mock/db.ts`, `app-shell.tsx`, `calendar.tsx`, etc.) but were never added to `package.json`. **None of these 25 errors are in any file touched by this pass's auth-wiring fix** — confirmed by re-running the check after all edits. This is a real, separate, pre-existing bug that currently breaks `npm run build`; it was not introduced or fixed in this pass and is flagged here for whoever picks it up next (likely: `npm install date-fns react-day-picker framer-motion`, then re-check for any resulting type errors).

## Integration Status

- **Auth: now real.** `App.tsx` talks to Supabase for authentication — sign in, sign up, sign out, and session persistence all go through `AuthContext.tsx` → `auth.service.ts` → the real Supabase client. This is the one part of the app genuinely wired to the live backend as of this pass.
- **Everything else: still 100% mock.** `TanStack Query` is wired into `App.tsx` via `QueryClientProvider`, and every feature folder (`employees`, `attendance`, `leave`, `payroll`) has real `useQuery`/`useMutation` hooks — but every one of those hooks still calls into `src/lib/mock/db.ts`, not Supabase. **Practical consequence of the auth fix:** a user can now really sign in/sign up against Supabase, but the employee list, attendance, leave, and payroll pages will look up that person's data in the mock in-memory dataset, which has no knowledge of real Supabase-issued UUIDs — so most authenticated pages will likely render empty or mismatched for a real account until those hooks are migrated off mock data too. That migration was not part of this pass.
- **React Router**: wired into `App.tsx` via `BrowserRouter`, with guest/protected/role-gated route groups. `/signup` is now registered (was missing before).
- **Supabase client**: now actually called from the live render tree, via `AuthContext.tsx`. Previously it was only reachable from orphaned files.
- **Live data source for non-auth features**: still 100% mock — `src/lib/mock/db.ts` and its companions (`seed.ts`, `people.ts`, `random.ts`, zero Supabase references). The employee/attendance/leave/payroll pages are unchanged by this pass.
- **Password reset flow**: unchanged — `forgot-password.tsx`/`reset-password.tsx` still don't call any backend; `onSubmit` is a bare `setTimeout(500ms)` simulation.
- **Broken imports**: none, confirmed via the *correct* invocation (`tsc -p tsconfig.app.json`) both before and after this pass's edits. See the tsc-invocation correction under Known Issues — the "0 errors" figure previously reported here was a false negative from checking the wrong project file; the real number, unrelated to auth wiring, is 25 (missing dependencies).

## How To Use This File

This file is updated incrementally as phases complete — check here first before re-reading the whole repo. If something here looks stale (a file path that's moved, a status that seems wrong given recent work), verify against the actual code before trusting it blindly; this snapshot reflects the repo as of the date above and nothing after it.

## Backend Connectivity Test

Date: 2026-08-22. Tested directly against the live Supabase project's REST/Auth HTTP endpoints (not against local code) using the public key from `.env`. No raw keys or tokens are recorded in this section.

### Metrics

| Endpoint | Method | Status Code | Latency (ms) | Result | Notes |
|---|---|---|---|---|---|
| `/rest/v1/` | GET | 401 | 82 | Fail* | `"Secret API key required"` — this specific root/introspection endpoint requires a secret key on this project; does not by itself indicate the public key is invalid (see next row) |
| `/auth/v1/settings` | GET | 200 | 175 | Pass | Project reachable, public key accepted, email auth enabled, anonymous sign-ins disabled |
| `/rest/v1/profiles?select=*&limit=1` | GET | 404 | 502 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/employees?select=*&limit=1` | GET | 404 | 452 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/attendance_records?select=*&limit=1` | GET | 404 | 209 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/leave_types?select=*&limit=1` | GET | 404 | 429 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/leave_requests?select=*&limit=1` | GET | 404 | 214 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/leave_approvals?select=*&limit=1` | GET | 404 | 198 | Fail | `PGRST205`: table not found in schema cache |
| `/rest/v1/salary_structures?select=*&limit=1` | GET | 404 | 202 | Fail | `PGRST205`: table not found in schema cache |
| Signup functional test | POST | — | — | N/A | Skipped — Part 2 showed `profiles`/`employees` don't exist on this database, so there's nothing for a new signup to be inserted into |

**Overall verdict: partially live.** The Supabase *project* itself is live, reachable, and has Auth configured (email sign-in enabled). But the *database schema has never been deployed to it* — all 7 required tables are confirmed absent via direct API test, consistent with the migration files under `supabase/migrations/` never having been applied to this project (no CLI link was ever established, per earlier audit passes).

### Tables: confirmed live vs missing

**Live: none.** **Missing (all 7):** `profiles`, `employees`, `attendance_records`, `leave_types`, `leave_requests`, `leave_approvals`, `salary_structures` — each returned PostgREST's `PGRST205` ("Could not find the table ... in the schema cache"), the standard "table does not exist" response, on a plain unauthenticated `select=*&limit=1` request.

### Separately-confirmed frontend bug (not a database issue)

`.env` defines `VITE_SUPABASE_PUBLISHABLE_KEY`; `src/lib/supabase/client.ts` reads `VITE_SUPABASE_ANON_KEY`. These don't match. Even once the schema above is deployed, the running app will throw `Missing Supabase environment variables` on load until this name mismatch is fixed (either rename the `.env` variable or update `client.ts` to read the new name — not fixed in this pass, report-only).

## Migration Reconciliation, Env Fix, and Deployment Attempt — 2026-08-22

**Phase 2/4 status unchanged from "Partial" this pass — deployment did not happen.** Per instruction, that table's `Partial` rows are left as-is rather than bumped to `Done`, because the tables are still not live on the remote database (confirmed by the connectivity re-test below). What follows explains what *was* done: the migration files themselves are now reconciled and ready to deploy, but nothing has actually been pushed to Supabase yet.

### 1. Migration reconciliation (files edited, nothing deployed)

Before editing, a full read of the third migration file (`create_employee_with_auth()`, originally `20250101000100_create_employee_rpc.sql`) surfaced a real ordering blocker: its `RETURNS public.employees` clause is resolved by Postgres at `CREATE FUNCTION` time (not deferred like the rest of a plpgsql body), so it requires the `employees` table to already exist. Its original timestamp sorted it to run *before* `20260822060408_initial_dayflow_schema.sql`, the file that actually creates `employees`. This was masked only because `auth_setup.sql` (before this pass) had its own `CREATE TABLE public.employees`. Removing that table definition — as the reconciliation required — would have made this file fail to `CREATE FUNCTION` on a fresh deploy.

**Fix:** the RPC file was renamed (content byte-identical, only the filename/timestamp changed) from `20250101000100_create_employee_rpc.sql` to `20260822060409_create_employee_rpc.sql`, so it now runs *after* the dayflow schema file. Confirmed final order: `20250101000000_auth_setup.sql` → `20260822060408_initial_dayflow_schema.sql` → `20260822060409_create_employee_rpc.sql`.

**`20250101000000_auth_setup.sql` was then stripped down** to contain only `public.handle_new_user()` and the `on_auth_user_created` trigger — the one piece of functionality that exists nowhere else. Removed: both `CREATE TABLE` statements (`profiles`, `employees` — now defined only in the dayflow schema file), the duplicate `public.is_admin()` (identical `CREATE OR REPLACE FUNCTION` already in the dayflow schema file), both `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements (the dayflow schema file already enables RLS on all 7 tables, these two included), and all 5 `CREATE POLICY` statements (the dayflow schema file's versions are kept as canonical — e.g. its `profiles_update_own` has an admin-override the removed version lacked). Execution-order safety was re-verified after the strip-down: `handle_new_user()`'s signature is `RETURNS trigger` (a built-in pseudo-type, no dependency), and its body's references to `public.profiles`/`public.employees` are deferred to first call — so this file is safe to run first even though those tables don't exist until the next file runs.

**No SQL logic was invented or changed** — only removed (in `auth_setup.sql`) or relocated (the RPC file's timestamp).

### 2. Env variable fix (applied, not yet deployment-relevant)

`src/lib/supabase/client.ts`: `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY`, matching what `.env` actually defines. `.env.example` updated the same way, so a new teammate copying it will set the right variable name. This fix is independent of the database work above — it unblocks the frontend from initializing the Supabase client at all, once the schema is deployed.

### 3. Deployment attempt — blocked, not completed

`npx supabase projects list` returned `LegacyPlatformAuthRequiredError` — the Supabase CLI is not authenticated in this environment. Per instruction, `supabase login` was not run automatically. **Linking, `db push`, and the leave_types seed migration were not attempted** — all three are gated on authentication that isn't present. These remain to be run manually (`npx supabase login`, then link + push) before the schema in this repo actually reaches the live database.

### 4. Connectivity re-test — unchanged from the previous pass, as expected

Re-ran the same table-by-table test (`GET /rest/v1/<table>?select=*&limit=1`) against the same project:

| Table | Status | Latency (ms) | Result |
|---|---|---|---|
| profiles | 404 | 719 | `PGRST205` — table not found |
| employees | 404 | 199 | `PGRST205` — table not found |
| attendance_records | 404 | 232 | `PGRST205` — table not found |
| leave_types | 404 | 197 | `PGRST205` — table not found |
| leave_requests | 404 | 228 | `PGRST205` — table not found |
| leave_approvals | 404 | 237 | `PGRST205` — table not found |
| salary_structures | 404 | 204 | `PGRST205` — table not found |

All 7 tables still absent — expected, since no push occurred. `leave_types` seed data was not created for the same reason (Part 5 of this pass's instructions was explicitly gated on a successful deploy).

**Net effect of this pass:** the migration files are now internally consistent and ready to deploy in one clean sequence (no more duplicate-table/duplicate-policy conflict, no more RPC ordering hazard), and the frontend's env-var bug is fixed — but none of it is live yet. The blocking step is CLI authentication (`npx supabase login`), which needs to be run manually before link/push/seed can proceed.

## First Real Deploy Attempt — 2026-08-22 (second entry, same day) — Failed, Phase 2/4 still Partial

CLI authentication was confirmed working this pass (`npx supabase projects list` returned a real project, not an auth error), and `.env` had meanwhile been updated to point at a new project (`hnpwaxmiyzngezfslroe`). `npx supabase link --project-ref hnpwaxmiyzngezfslroe --yes` succeeded.

`npx supabase db push` **failed**: `relation "public.profiles" does not exist (SQLSTATE 42P01)`, at statement 2 of `20260822060408_initial_dayflow_schema.sql`, inside `CREATE OR REPLACE FUNCTION public.is_admin()`.

**Root cause — a pre-existing bug in the dayflow schema file, unrelated to the previous pass's reconciliation:** `public.is_admin()` is declared `LANGUAGE sql`. Unlike `plpgsql` function bodies (opaque text, resolved lazily on first call — the property the previous entry's ordering analysis relied on), a `LANGUAGE sql` function body is parsed and validated as real SQL immediately at `CREATE FUNCTION` time, so every table it references must already exist right then. In this file, `is_admin()` is defined near the top, before the later `CREATE TABLE public.profiles` statement. This was never touched by the reconciliation work above (which only edited `auth_setup.sql` and renamed the RPC file) and was invisible until this, the first real push against a live database.

**Current true remote state** (`npx supabase migration list`): `20250101000000_auth_setup.sql` is applied (its `handle_new_user()`/trigger now exist on the remote); `20260822060408_initial_dayflow_schema.sql` rolled back entirely on the error above (nothing from it landed — no tables, no RLS, no policies); the RPC file was never reached. Re-confirmed via direct REST calls: all 7 tables still return `404 PGRST205`.

**Not fixed in this pass** — per instruction, stopped immediately on the push error rather than attempting a fix. `20260822060408_initial_dayflow_schema.sql` was not edited. Phase 2 and Phase 4 remain `Partial` in the table above; the condition for bumping them to `Done` (all 7 tables confirmed live with RLS intact) is not met.

## Deployment Succeeded — 2026-08-22 (third entry, same day) — Phase 2 and Phase 4 now Done

### What was relocated, and why

A full scan of `20260822060408_initial_dayflow_schema.sql` for `LANGUAGE sql` functions (the kind whose bodies are validated eagerly at `CREATE FUNCTION` time, unlike `LANGUAGE plpgsql`, which defers body resolution to first call) found exactly **one** function of that kind: `public.is_admin()`. It was defined near the top of the file, before the `CREATE TABLE public.profiles` statement it references — the exact cause of the previous entry's push failure. `set_updated_at()` and `approve_leave_request()` are both `LANGUAGE plpgsql` with built-in `RETURNS` types (`trigger`, `VOID`), so neither was a hazard regardless of what their bodies reference.

**Fix:** `is_admin()` (comment block + function, byte-identical content) was cut from its original position and pasted immediately after the last `CREATE TABLE` statement (end of `salary_structures`) and before the `UPDATED_AT TRIGGERS` section. `git diff --stat` on the file showed exactly 22 insertions / 22 deletions — confirming a pure relocation, no logic/parameter/body changes, nothing else in the file touched.

### Deployment

`npx supabase db push` (first run, after the relocation):
```
Initialising login role...
Connecting to remote database...
Skipping migration .gitkeep... (file name must match pattern "<timestamp>_name.sql")
Applying migration 20260822060408_initial_dayflow_schema.sql...
Applying migration 20260822060409_create_employee_rpc.sql...
{"upToDate":false,"dryRun":false,"migrations":["20260822060408_initial_dayflow_schema.sql","20260822060409_create_employee_rpc.sql"],"seeds":[],"roles":[],"message":"Finished supabase db push."}
```
**Succeeded** — both remaining migrations applied cleanly.

### Seed migration

Created `supabase/migrations/20260822060410_seed_leave_types.sql`, inserting the 4 required `leave_types` rows (`Paid Leave`, `Sick Leave`, `Unpaid Leave`, `Casual Leave`, all `is_active = true`) with `ON CONFLICT (name) DO NOTHING`. Note: the dayflow schema file already contains its own seed insert for the same 4 rows (without an explicit `is_active`, relying on the column default), so this dedicated migration is effectively a harmless no-op today — but it's now tracked and reproducible as its own migration, as required, rather than depending solely on being bundled inside the schema file.

`npx supabase db push` (second run, applying the seed migration):
```
Initialising login role...
Connecting to remote database...
Skipping migration .gitkeep... (file name must match pattern "<timestamp>_name.sql")
Applying migration 20260822060410_seed_leave_types.sql...
{"upToDate":false,"dryRun":false,"migrations":["20260822060410_seed_leave_types.sql"],"seeds":[],"roles":[],"message":"Finished supabase db push."}
```
**Succeeded.**

### Final connectivity proof

Table-by-table REST test (anonymous/publishable-key request, `select=*&limit=1`):

| Table | Status | Latency (ms) | Body |
|---|---|---|---|
| profiles | 200 | 955 | `[]` |
| employees | 200 | 263 | `[]` |
| attendance_records | 200 | 242 | `[]` |
| leave_types | 200 | 231 | `[]` |
| leave_requests | 200 | 202 | `[]` |
| leave_approvals | 200 | 256 | `[]` |
| salary_structures | 200 | 242 | `[]` |

All 7 return `200` with an empty array — expected and correct, since every RLS policy in the schema is scoped `TO authenticated`, so an anonymous request can never see rows on any of these tables (this is the intended behavior, not a gap).

**`leave_types` row count — verified directly, bypassing RLS**, via `npx supabase db query --linked` (uses the CLI's already-authenticated connection, not a REST call, so it isn't subject to the `TO authenticated` policy restriction that hides rows from anonymous requests): exactly 4 rows — `Casual Leave`, `Paid Leave`, `Sick Leave`, `Unpaid Leave`, all `is_active: true`.

**RLS enablement — also verified directly**, via `SELECT relname, relrowsecurity FROM pg_class WHERE ...`: all 7 tables return `relrowsecurity: true`.

`npx supabase migration list` (definitive record):
```
{"migrations":[
  {"local":"20250101000000","remote":"20250101000000","time":"2025-01-01 00:00:00"},
  {"local":"20260822060408","remote":"20260822060408","time":"2026-08-22 06:04:08"},
  {"local":"20260822060409","remote":"20260822060409","time":"2026-08-22 06:04:09"},
  {"local":"20260822060410","remote":"20260822060410","time":"2026-08-22 06:04:10"}
]}
```
Every local migration's timestamp is matched on `remote` — full deployment confirmed.

**Phase 2 and Phase 4 updated from `Partial` to `Done` in the table above** — the condition (all 7 tables confirmed live with RLS intact) is met, verified directly rather than assumed from the push succeeding alone.
