# Tasks – Login & Leave Request

> **In what order, and how to check.** Build one task at a time, in order.
> After each task: the AI builds it → a reviewer agent tests it → **you check it
> in the browser**.
>
> If a check fails, **fix the spec first** (requirements or design), then ask
> the AI to rebuild. The requirements and design are the source of truth.
>
> These tasks are **already done** in the starter app – they show what a task
> list looks like. In Session 2, add the Leave Request tasks after Task 6.
>
> The Leave Request tasks (7–16) are now added below. Build them **one at a
> time, in this order**. All are **Core** — the requirements deferred
> nothing, so there are no Stretch tasks.

**Core and Stretch.** **Core** tasks must be finished first: the app is not
usable without them. **Stretch** tasks are nice extras. Do them only if time is
left, and only if you ask for them. All the login tasks are Core, because login
has to work before anything else.

**Before you start:** `npm install`, then `cp .env.example .env`
(Windows: `copy .env.example .env`).

| # | Task | Core / Stretch | Checks (from requirements §4) |
|---|------|----------------|-------------------------------|
| 1 | Set up the app | Core | – |
| 2 | Database table and demo users | Core | – |
| 3 | Log in and log out | Core | AC-01, AC-02, AC-03, AC-06 |
| 4 | Role protection and home pages | Core | AC-04, AC-05, AC-07 |
| 5 | Top bar | Core | AC-08, AC-09 |
| 6 | Final check and README | Core | All |
| 7 | Leave data in the database | Core | – |
| 8 | Rule-book: days, transitions, visibility | Core | – |
| 9 | Sample requests in the seed | Core | – |
| 10 | Employee home table | Core | AC-20 |
| 11 | New request form and submit | Core | AC-10–13, AC-23, AC-24 |
| 12 | Employee detail and Send to HR | Core | AC-21, AC-23, AC-24 |
| 13 | Supervisor list, sign and reject | Core | AC-14, AC-15, AC-23, AC-24 |
| 14 | HR list, approve and reject | Core | AC-16–19, AC-23 |
| 15 | Admin list and read-only detail | Core | AC-22 |
| 16 | Full walk-through and docs | Core | All |

---

## Task 1 – Set up the app *(Core)*

- **Goal:** A Next.js + TypeScript app with Tailwind CSS that starts.
- **Files:** `package.json`, `next.config.ts`, `tsconfig.json`,
  `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  (starts with `@import "tailwindcss";` – no Tailwind config file needed).
- **Check:** `npm run dev` starts, and http://localhost:3000 shows a page.

## Task 2 – Database table and demo users *(Core)*

- **Goal:** Prisma with SQLite, the `User` table from design Part A, and the
  demo users from design §6 with hashed passwords.
- **Files:** `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`,
  `src/lib/db.ts`, `src/lib/constants.ts`, `.env.example`, the `db:seed`
  script in `package.json`.
- **Check:** `npm run db:migrate` creates `prisma/dev.db`. `npm run db:seed`
  prints the 7 demo users, and `npm run db:studio` shows them.

## Task 3 – Log in and log out *(Core)*

- **Goal:** Login page, signed session cookie, and logout with a confirmation
  box. After login, go to the role's home page.
- **Files:** `src/lib/auth.ts` (`getCurrentUser`, `startSession`, `endSession`,
  `roleHome`), `src/app/actions.ts` (`loginAction`, `logoutAction`),
  `src/app/login/page.tsx`, `src/components/LoginForm.tsx`,
  `src/components/LogoutButton.tsx`, `src/components/ui/` (Button, Field,
  dialogs).
- **Check:** AC-01, AC-02, AC-03, AC-06.

## Task 4 – Role protection and home pages *(Core)*

- **Goal:** A `requireRole(...)` helper used at the top of every page, so each
  role sees only its own screens, and a home page for each role with only a short hint line.
- **Files:** `src/lib/auth.ts`, `src/app/employee/page.tsx`,
  `src/app/supervisor/page.tsx`, `src/app/hr/page.tsx`,
  `src/app/admin/page.tsx`.
- **Check:** AC-04, AC-05, AC-07.

## Task 5 – Top bar *(Core)*

- **Goal:** The top bar from design §4 (app name, who is logged in, **Log
  out**), and the **Not found** page.
- **Files:** `src/components/AppShell.tsx`, `src/components/LogoutButton.tsx`,
  `src/components/ui/`, `src/app/not-found.tsx`.
- **Check:** AC-08, AC-09.

## Task 6 – Final check and README *(Core)*

- **Goal:** Run `npm run db:seed`, then walk through the whole acceptance
  checklist as each role. Make sure `README.md` explains how to install, run
  and test.
- **Check:** Every AC box ticked; `npm run lint` and `npm run build` pass.

---

# Leave Request module tasks (Session 2)

> Build **one task at a time, in this order**: data → rules → sample data →
> screens. Screens go employee-first (that is where a request is born),
> then supervisor, HR, admin. Keep `npm run lint` green after every task.
> If a check fails, **fix the spec line first**, get it approved, then
> rebuild — never patch silently in code.

## Task 7 – Leave data in the database *(Core)*

- **Goal:** The `LeaveRequest` table from design Part A §1 exists, and the
  fixed values for leave types and statuses (rule 6) live in
  `src/lib/constants.ts` with their display labels.
- **Files:** `prisma/schema.prisma`, a new step in `prisma/migrations/`,
  `src/lib/constants.ts`.
- **Check:** `npm run db:migrate` applies; `npm run db:studio` shows an empty
  `LeaveRequest` table with exactly the Part A fields; `npm run lint` passes.

## Task 8 – One rule-book (`src/lib/leave.ts`) *(Core)*

- **Goal:** A single module that knows the rules: the Mon–Fri day count
  (rule 8), the allowed status transitions (rule 10), and who may view/act
  (rule 13). Screens and server actions will call it instead of repeating
  rules.
- **Files:** `src/lib/leave.ts`.
- **Check:** `npm run lint` passes; `npx tsx` prints `2` for a Friday→Monday
  span and `1` for Monday→Tuesday using the day-count helper, and the
  transition helper refuses Signed → Approved.

## Task 9 – Sample requests in the seed *(Core)*

- **Goal:** `npm run db:seed` also creates the seven sample requests from
  design §6, with `workingDays` computed by the Task 8 helper.
- **Files:** `prisma/seed.ts`.
- **Check:** `npm run db:seed` prints the users and the 7 requests;
  `npm run db:studio` shows all five statuses and sensible day counts.

## Task 10 – Employee home table *(Core)*

- **Goal:** `/employee` replaces the hint page with the shared request table
  — own requests only, newest first, columns Type | Dates | Days | Status |
  Submitted on — plus an EmptyState when there are none. Rows are plain text
  for now; row links come with Task 12.
- **Files:** `src/app/employee/page.tsx`,
  `src/components/leave/RequestTable.tsx`,
  `src/components/ui/StatusBadge.tsx`.
- **Check:** AC-20 (as `employee-2`: the own 4 requests, nothing of
  employee-1, newest first); statuses shown as coloured badges;
  `npm run lint` passes.

## Task 11 – New request form and submit *(Core)*

- **Goal:** The **New request** button and the `/employee/new-request` form
  (type, dates, own-division supervisor select, optional reason, live
  working-days preview). `submitRequestAction` stores the row with the
  **server-computed** `workingDays` and status Waiting for Supervisor.
  Confirmation box first, success box after, then back to `/employee`.
- **Files:** `src/app/employee/new-request/page.tsx`,
  `src/components/leave/NewRequestForm.tsx`, `src/app/leave/actions.ts`
  (submit), `src/app/employee/page.tsx` (the button).
- **Check:** AC-10, AC-11, AC-12, AC-13, AC-23 (submit), AC-24 (logged-out →
  `/login`; `supervisor-1` typing the new-request address → back to
  `/supervisor`).

## Task 12 – Employee detail and Send to HR *(Core)*

- **Goal:** `/employee/[id]` shows every field, the reason and both remarks
  using the shared fields panel; a **Signed** request offers **Send to HR**
  (confirm → success), moving it to Waiting for HR. No edit, withdraw or
  re-send control anywhere (AC-21). Table rows become links here.
- **Files:** `src/app/employee/[id]/page.tsx`,
  `src/components/leave/RequestDetail.tsx`,
  `src/components/leave/RequestActions.tsx` (send), `src/app/leave/actions.ts`
  (send to HR), `src/components/leave/RequestTable.tsx` (row links).
- **Check:** AC-21, AC-23 (send), AC-24 (opening employee-1's request id as
  `employee-2` → **Not found**).

## Task 13 – Supervisor list, sign and reject *(Core)*

- **Goal:** `/supervisor` lists the requests naming the logged-in supervisor;
  `/supervisor/[id]` shows the shared fields panel and, while Waiting for
  Supervisor, offers **Sign** and **Reject** (remark box; empty refused).
- **Files:** `src/app/supervisor/page.tsx`,
  `src/app/supervisor/[id]/page.tsx`,
  `src/components/leave/RequestActions.tsx` (sign/reject),
  `src/app/leave/actions.ts` (sign, reject by supervisor).
- **Check:** AC-14, AC-15, AC-23 (sign/reject), AC-24 (`supervisor-1` opening
  a request that names supervisor-2 → **Not found**).

## Task 14 – HR list, approve and reject *(Core)*

- **Goal:** `/hr` lists every request — the shared queue (Waiting for HR)
  sits inside it; `/hr/[id]` offers **Approve** and **Reject** (remark
  required on reject) while Waiting for HR, and records the logged-in
  officer as the deciding officer (rule 12).
- **Files:** `src/app/hr/page.tsx`, `src/app/hr/[id]/page.tsx`,
  `src/components/leave/RequestActions.tsx` (approve/reject),
  `src/app/leave/actions.ts` (approve, reject by HR).
- **Check:** AC-16 (the sent request appears for **both** `hr-1` and `hr-2`),
  AC-17, AC-18, AC-19, AC-23 (approve/reject).

## Task 15 – Admin list and read-only detail *(Core)*

- **Goal:** `/admin` lists every request; `/admin/[id]` shows the shared
  fields panel with **no buttons ever**, and the server refuses admin
  actions too.
- **Files:** `src/app/admin/page.tsx`, `src/app/admin/[id]/page.tsx`.
- **Check:** AC-22.

## Task 16 – Full walk-through and docs *(Core)*

- **Goal:** Start from `npm run db:seed` and tick **every** box, AC-01–AC-24,
  as each role. Keep README and specs true to the app: README explains the
  module and the sample requests; if AC-01's old "hint line" wording clashes
  with the new home pages, fix that **spec line first** and get it approved.
- **Files:** `starter-project/README.md`; `docs/specs/*` only where a line
  needed the spec-first fix.
- **Check:** Every AC box ticked from a fresh seed; login checks AC-01–AC-09
  still pass; `npm run lint` and `npm run build` pass.
