# Design – Login & Leave Request

> **How it is built.** This document turns the requirements into a plan a
> builder (person or AI) can follow without asking the business again.
> [01-requirements.md](01-requirements.md) is the source of truth for
> *behaviour*; if the two disagree, fix the requirements first, then this file.
>
> - **Part A – Data design** (sections 1–2): **you own and review this.**
> - **Part B – App design** (sections 3–8): the AI drafts this; you check it.
>
> Both parts now cover the Leave Request module (Session 2). **Part A**
> (`LeaveRequest` table, statuses, rules 6–13) was reviewed and **approved**;
> **Part B** (module screens, code layout, demo data, security) is the AI
> draft, awaiting review.

---

# Part A – Data design (you review)

## 1. Tables

The app stores data in two tables. Every row gets a number (`id`)
automatically.

### `User` – one row per person who can log in

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the user |
| `email` | text | yes, unique | Used to log in, stored in lowercase, e.g. `employee-1@budiman.com` |
| `name` | text | yes | Full name shown on screen, with the division in brackets, e.g. "Employee 1 (Finance & Administration)" |
| `passwordHash` | text | yes | Scrambled password – never the real one |
| `role` | text | yes | `EMPLOYEE`, `SUPERVISOR`, `HR` or `ADMIN` |
| `identificationNo` | text | yes | Staff ID: `00-1` then 5 digits, e.g. `00-148291` |
| `designation` | text | yes | Job title, one of the list in rule 4, e.g. `Administrative Officer` |
| `division` | text | yes | Department, one of the list in rule 4, e.g. `Finance & Administration` |
| `createdAt` | date + time | auto | When the user was created |

> **Why is role plain text?** SQLite (our database) does not support a fixed
> list of choices ("enums"). So the allowed values are listed in
> `src/lib/constants.ts`, and the app checks them.

### `LeaveRequest` – one row per leave request

Created **only** by an employee pressing **Submit** on the New request form;
never edited afterwards (rule 13). Rows are also never deleted.

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the request |
| `employeeId` | number | yes | Who applied — a `User` (the app stores only the person on leave, never a name) |
| `supervisorId` | number | yes | The chosen supervisor — a `User` with role `SUPERVISOR` in the employee's own division (rule 9) |
| `type` | text | yes | `ANNUAL` (shown as "Annual") or `SICK` (shown as "Sick") — rule 6 |
| `startDate` | date | yes | First day of leave — a whole calendar day, no time |
| `endDate` | date | yes | Last day of leave — never before `startDate` (rule 7) |
| `workingDays` | number | yes | Count of Mon–Fri days between `startDate` and `endDate`, inclusive. Calculated by the **server** on submit (rule 8); shown in the Days column |
| `reason` | text | no | The employee's optional reason; empty string when not given |
| `status` | text | yes | `WAITING_SUPERVISOR`, `SIGNED`, `WAITING_HR`, `APPROVED` or `REJECTED` — rule 10 |
| `supervisorRemark` | text | no | The supervisor's remark. Required on rejection, optional on signing (rule 11) |
| `hrRemark` | text | no | The HR officer's remark. Required on rejection, optional on approving (rule 11) |
| `decidedByHrId` | number | no | The HR officer who approved or rejected — a `User`; empty until HR decides (rule 12) |
| `createdAt` | date + time | auto | When the request was submitted — shown as "Submitted on" |

> **Why store `workingDays`?** The count is fixed at submission so every page
> shows the same number and the acceptance checks (AC-10, AC-13) stay true,
> even if the calendar rules change later.
>
> **Why no `signedAt` / `sentAt` timestamps?** No screen shows them, and the
> rules never need them — so they are not stored ("nothing stored in case").

### How a request's status moves (in plain words)

A request starts at **Waiting for Supervisor**. If the supervisor signs it,
it becomes **Signed** and waits for the employee to send it; if the
supervisor rejects it, it ends **Rejected**. Once the employee sends it, it
becomes **Waiting for HR**, where either HR officer can decide: **Approved**,
or **Rejected** with a reason. **Approved** and **Rejected** are final — the
request never moves again, there is no withdraw, and a rejected one is never
re-sent (the employee applies afresh instead). Rule 10 says exactly who may
make each move.

## 2. Business rules

1. **Emails.** Every email is a company address ending in `@budiman.com`. It is
   stored in lowercase and is unique, so login ignores capitals.
2. **Passwords.** Stored only as a hash (bcrypt). A wrong email and a wrong
   password give the **same** message, so nobody can find out which emails exist.
3. **Roles.** Each user has exactly one role. The role decides which pages they
   can open (§4).
4. **Divisions and designations** are chosen from fixed lists, kept in
   `src/lib/constants.ts`:
   - **Division:** Software Development, Quality Assurance, IT Infrastructure &
     Operations, Cybersecurity, Data & Analytics, Product & Design, Customer
     Support, Human Resources, Finance & Administration, Management.
   - **Designation:** Software Engineer, QA Engineer, System Administrator,
     IT Support Technician, Data Analyst, UI/UX Designer, Team Lead, HR Officer,
     Administrative Officer, Director. The designation is only a job title;
     the role decides what someone can do.
5. **Sessions.** A login lasts 7 days on the same browser, then the user must
   log in again.

**Leave Request rules (added in Session 2):**

6. **Leave types.** Only `ANNUAL` and `SICK`, with their display names, kept
   in `src/lib/constants.ts` (SQLite has no enums). There is no screen to
   manage them.
7. **Dates.** `endDate` is never before `startDate`; the server rejects it
   otherwise (AC-11). Leave in the past is allowed — sick leave is often
   reported afterwards. Both dates are whole days.
8. **Day counting.** `workingDays` counts Monday–Friday days between the two
   dates inclusive (Fri→Mon = 2). Weekends never count; there is no
   public-holiday calendar. The server computes it on submit; the client's
   value is never trusted.
9. **The supervisor.** Must be a user with role `SUPERVISOR` in the same
   division as the employee. The picker offers only those (AC-12), and the
   server re-checks it on submit — a crafted request with another division's
   supervisor is rejected.
10. **Status.** Starts at `WAITING_SUPERVISOR`. The only allowed changes are:
    `WAITING_SUPERVISOR → SIGNED` or `→ REJECTED` (by the assigned supervisor
    only); `SIGNED → WAITING_HR` (by the request's own employee only);
    `WAITING_HR → APPROVED` or `→ REJECTED` (by any HR officer). `APPROVED`
    and `REJECTED` are final — the row never changes again, and the admin
    changes nothing. An action with no right, or that skips a step, is
    refused on the server.
11. **Remarks.** A rejection (supervisor or HR) needs a remark — empty is
    refused by the server. Signing/approving may leave the remark empty. Once
    set, a remark is never edited.
12. **HR attribution.** On approve/reject, `decidedByHrId` records the logged-in
    HR officer (AC-17/18). It is never set by the supervisor's decision.
13. **Immutability and who may act — and who sees what.** Nobody edits or
    deletes a request; there is no withdraw and no re-send after rejection —
    the employee submits a fresh request. A row is created only by
    `employeeId` themselves, and only `supervisorId`, the request's employee,
    or an HR officer may change it, each within the transitions of rule 10.
    Every page and every server action also enforces who may *see* a row:
    employees only their own (AC-20), supervisors only those naming them, HR
    and Admin all rows (Admin read-only, AC-22).

---

# Part B – App design (AI drafts, you check)

## 3. Technology

Chosen so everyone can run the app on their own laptop with no extra accounts.

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | **Next.js** (App Router) + **TypeScript** | Builds both the screens and the server logic in one project. |
| Database | **SQLite** via **Prisma 6** | The database is a single file; Prisma lets the code read and write it. |
| Login | Signed **session cookie** | After login the browser keeps a signed note saying who you are (7 days). JavaScript on the page can't read it (`httpOnly`). |
| Passwords | **bcryptjs** | Stores a scrambled version of each password. |
| Styling | **Tailwind CSS v4** | Styles are written as class names, e.g. `text-sm`. No config file needed. |
| Buttons and forms | **Server actions** | Pressing a button calls a function on the server, which checks the user before doing anything. There are no separate `/api` routes. |

## 4. Screens (routes)

After login, each user is sent to their role's home page. Opening a page for
another role sends you back to your own home page.

| Route | Who | What it shows |
|-------|-----|---------------|
| `/` | anyone | Sends you to your home page, or to `/login`. |
| `/login` | anyone | Email and password form. A logged-in user is sent to their home page. |
| `/employee` | Employee | Their own requests, newest first, in the request table (columns **Type \| Dates \| Days \| Status \| Submitted on**), plus a **New request** button. Empty list → an EmptyState with a nudge to make the first request. |
| `/employee/new-request` | Employee | The request form (rules 7–9): type select (Annual/Sick), start and end date, supervisor select **listing only supervisors of the employee's own division**, optional reason, and a live "Working days" preview as dates are picked. **Submit** → confirmation box → success box → back to `/employee`. |
| `/employee/[id]` | Employee — only their own request | Their view of the request: status, dates and days, reason, both remarks, the deciding officer. When it is Signed, a **Send to HR** button appears (confirmation box → success box). There is **never** an edit, withdraw or re-send button here (AC-21). |
| `/supervisor` | Supervisor | The requests that name them as supervisor, newest first, in the same table. |
| `/supervisor/[id]` | Supervisor — only requests naming them | The request's fields, and while it is Waiting for Supervisor: **Sign** and **Reject** (reject shows a remark box; empty is refused — rules 10–11). |
| `/hr` | HR | Every request in the system, newest first — the shared queue (Waiting for HR) sits inside this list. |
| `/hr/[id]` | HR | The request's fields, and while it is Waiting for HR: **Approve** and **Reject** (remark required on reject). Once decided, the deciding officer's name shows on it (rule 12). |
| `/admin` | Admin | Every request in the system, newest first. The list is display-only. |
| `/admin/[id]` | Admin | Read-only detail: all fields, reason, remarks, deciding officer. **No buttons at all**, ever. |

**One screen per action, under each role's own pages.** Each action above
has its own screen inside that role's folder, so an employee never sees
supervisor buttons and an admin never sees any — the page itself is
role-scoped. The four lists share **one** table component; the four detail
screens share **one** fields panel; only the action buttons differ, and the
server re-checks everything anyway (rule 10/13).

A page that doesn't exist — or a request rule 13 says the viewer may not
see — shows **Not found**, with a button back to your home page.

**Layout:** no sidebar. A top bar across every page shows the app name
(Budiman HRMS) on the left. On the right it shows who is logged in (name and
role) and a **Log out** button. On a phone it shows the user's initials
instead of the name and role. Each module page has a PageHeader (role title)
and its content in a Card.

**Feedback:** every action (**Log out**, submit, sign, reject, send, approve)
opens a confirmation box first; after it, a success box appears (AC-23).
Errors — invalid dates, missing remark, a refused action — are shown in red
above the form or button, same pattern as the login form.

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The tables from Part A. |
| `prisma/migrations/` | Steps that create the tables. |
| `prisma/seed.ts` | The demo users (§6). |
| `src/lib/constants.ts` | Roles, divisions, designations, time zone, date helpers; **new:** leave types and statuses with their display labels. |
| `src/lib/leave.ts` | **new** — the module's single rule-book: working-day count (rule 8), allowed transitions (rule 10), who may view/act (rule 13). Every page and action calls it instead of repeating rules. |
| `src/lib/auth.ts` | Login cookie, `getCurrentUser()`, `requireRole()`, `roleHome()`. |
| `src/lib/db.ts` | The single database connection. |
| `src/app/actions.ts` | Server actions: `loginAction`, `logoutAction`. |
| `src/app/login/` | The login page. |
| `src/app/<role>/` | One folder per role. Home pages now show the request table; `employee/new-request/` holds the request form. |
| `src/app/<role>/[id]/page.tsx` | **new** — one detail/action screen per role (`/employee/[id]`, `/supervisor/[id]`, `/hr/[id]`, `/admin/[id]`), each showing only that role's buttons. |
| `src/app/leave/actions.ts` | **new** — the six server actions: submit, sign, reject (supervisor), send to HR, approve, reject (HR). Each re-checks login, role, row ownership and current status before touching data. |
| `src/components/` | Screen pieces: app frame (top bar), login form and log out button. |
| `src/components/leave/` | **new** — `RequestTable` (the one shared table for all four lists), `RequestDetail` (the shared fields panel used by all four detail screens), `NewRequestForm`, `RequestActions` (per-role action buttons, each with its confirmation and success box). |
| `src/components/ui/` | Small building blocks used everywhere: Button, Card, PageHeader, EmptyState, Avatar, Icons, form field styles, dialogs, and the overlay page scrollbar. The module reuses all of these; the **only new piece** is `StatusBadge` (one colour per status). |
| `src/app/globals.css` | Brand colours (the `brand-…` and `navy` colours). Change them here. |

## 6. Demo data

`npm run db:seed` deletes all users and requests, then creates the users
below, plus the sample requests after the table. (Still one command — no
extra script for the module.)

| Email (`@budiman.com`) | Name | Role | ID no. | Designation | Division |
|----------|------|------|--------|-------------|----------|
| `employee-1@` | Employee 1 (Finance & Administration) | Employee | 00-148291 | Administrative Officer | Finance & Administration |
| `employee-2@` | Employee 2 (Software Development) | Employee | 00-173604 | Software Engineer | Software Development |
| `supervisor-1@` | Supervisor 1 (Finance & Administration) | Supervisor | 00-159827 | Team Lead | Finance & Administration |
| `supervisor-2@` | Supervisor 2 (Software Development) | Supervisor | 00-126418 | Team Lead | Software Development |
| `hr-1@` | HR 1 (Human Resources) | HR | 00-191356 | HR Officer | Human Resources |
| `hr-2@` | HR 2 (Human Resources) | HR | 00-184072 | HR Officer | Human Resources |
| `admin@` | Admin (Management) | Admin | 00-105739 | Director | Management |

All use the password `password123` (workshop only). There are two users for
each of Employee, Supervisor and HR, in different divisions, so the module you
build can be tested with more than one person per role.

**Sample leave requests** — also created by `npm run db:seed`, covering every
status so the module checks (AC-10–AC-24) run from clean data:

| # | Employee | Supervisor | Type | Status | Why it is there |
|---|----------|------------|------|--------|-----------------|
| 1 | Employee 2 | Supervisor 2 | Annual | Waiting for Supervisor | AC-14 — supervisor signs it |
| 2 | Employee 2 | Supervisor 2 | Sick | Waiting for Supervisor | AC-15 — supervisor rejects it |
| 3 | Employee 2 | Supervisor 2 | Annual | Signed | AC-16 — employee sends it to HR |
| 4 | Employee 1 | Supervisor 1 | Annual | Waiting for HR | AC-17/18 — hr-1 approves, HR 1 recorded |
| 5 | Employee 1 | Supervisor 1 | Sick | Waiting for HR | AC-19 — hr-2 rejects it |
| 6 | Employee 1 | Supervisor 1 | Annual | Approved (decided by HR 2) | AC-22 — content for the admin list |
| 7 | Employee 2 | Supervisor 2 | Sick | Rejected by Supervisor 2, remark set | AC-21 — a final rejection to inspect |

Seed dates sit close to the day the seed runs (within the last and the next
two weeks), and `workingDays` is computed by the same Mon–Fri rule, so every
list looks current. Requests 1–3 and 7 belong to Employee 2, and 4–6 to
Employee 1 — which also proves AC-20 (each employee sees only their own).

## 7. Security (in plain words)

- Every page checks who is logged in and their role (`requireRole`).
- Every server action checks again on the server – hiding a button is not enough.
- The login cookie is signed with `AUTH_SECRET` from `.env`, so it can't be faked.
- Passwords are stored only as a hash.
- Every module page calls `requireRole`, and every detail screen applies rule
  13's visibility *before* showing a row — a request you may not see answers
  **Not found**, whether it was reached by click or by typed address.
- All six leave server actions re-check four things before touching data: who
  is logged in, that the role may perform that action, that the row belongs to
  them in the right way, and that the current status allows the transition
  (rule 10). A crafted request is refused even though the button was never
  shown.
- The working-day count and every stored value are computed server-side
  (rule 8); values sent by the browser are never trusted.

## 8. Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run db:migrate` | Create or update the database tables |
| `npm run db:seed` | Reset the demo users and sample leave requests |
| `npm run db:studio` | Open a browser view of the database |
| `npm run lint` | Check the code for common mistakes |
| `npm run build` | Check the whole app compiles |
