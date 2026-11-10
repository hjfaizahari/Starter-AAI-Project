# Requirements – Login & Leave Request

> **What and why.** This document says what the app must do and why. It is
> the source of truth for behaviour: when something needs to change, update this
> document **first**. New to specs? Read [README.md](README.md) first.
>
> §1–5 describe the **login** (already built). §6–11 describe the
> **Leave Request module**, added after the Session 2 interview — the same
> five sections, repeated below. Story (U…) and check (AC…) numbers continue
> across the two parts.

## 1. The problem

Budiman Company is building an HR Management System. Before anyone can use
it, the system has to know **who is using it** and **what they are allowed to
do**.

This first part of the system provides:

1. A **login** with each person's company email and password.
2. A **home page for each role**, so everyone lands in the right place.
3. **Protection**, so nobody can open another role's pages.

## 2. Who uses it (roles)

| Role | Home page | What they will do (built in Session 2) |
|------|-----------|-----------------------------------------|
| **Employee** | `/employee` | Apply for leave and track their requests. |
| **Supervisor** | `/supervisor` | Decide on requests sent to them. |
| **HR** | `/hr` | Decide on requests sent to HR. |
| **Admin** | `/admin` | See every leave record. |

Each user has exactly one role.

## 3. User stories

Format: *As a [role], I can [do something] so that [benefit].*

- **U1. Log in** *(Core)*. As any user, I can log in with my company email and
  password so that I see the screens for my role.
- **U2. Land on my home page** *(Core)*. As any user, after logging in I go
  straight to my role's home page, so I don't have to look for it.
- **U3. Stay logged in** *(Core)*. As any user, I stay logged in for up to 7
  days on the same browser, so I don't have to log in every time.
- **U4. Log out** *(Core)*. As any user, I can log out when I'm done, so the
  next person on this computer can't use my account.
- **U5. Only my own screens** *(Core)*. As any user, I can only open the pages
  for my own role, so nobody can act as someone else.

## 4. Acceptance checklist

The login is done when every box is ticked. Use the demo accounts (password
`password123`): `employee-1` and `employee-2` (Employees), `supervisor-1` and
`supervisor-2` (Supervisors), `hr-1` and `hr-2` (HR), `admin` (Admin). Each
logs in with that name followed by `@budiman.com`, e.g.
`employee-1@budiman.com`; the checks below use the short name.
Run `npm run db:seed` first to start from clean data.

| ✓ | ID | Check | How to test |
|---|----|-------|-------------|
| [ ] | AC-01 | A user can log in and lands on their role's home page. | Log in as `employee-1` → you are on `/employee`, a page with only a short hint line. Repeat for `supervisor-1` (`/supervisor`), `hr-1` (`/hr`), `admin` (`/admin`). |
| [ ] | AC-02 | A wrong password or an unknown email shows an error. | Log in as `employee-1` with password `wrong` → "Invalid email or password." Try `nobody@budiman.com` → the same message. |
| [ ] | AC-03 | Empty fields are not sent. | Click **Log in** with the boxes empty → the browser asks you to fill them in. |
| [ ] | AC-04 | A logged-out user is sent to the login page. | Log out, then type `/employee` in the address bar → you are on `/login`. |
| [ ] | AC-05 | A logged-in user who opens the login page goes to their home page. | Logged in as `hr-1`, type `/login` → you are on `/hr`. |
| [ ] | AC-06 | Logging out asks first, then returns to the login page. | Click **Log out** in the top bar → a confirmation box → confirm → you are on `/login`. |
| [ ] | AC-07 | A user cannot open another role's pages. | As `employee-1`, type `/hr` or `/admin` → you are sent back to `/employee`. As `admin`, type `/employee` → you are sent back to `/admin`. |
| [ ] | AC-08 | Every page shows who is logged in. | The top bar shows the user's name and role. On a phone, it shows the user's initials instead. |
| [ ] | AC-09 | An unknown page shows "Not found". | Type `/something-else` → "Not found", with a button back to your home page. |

## 5. Not included (for now)

These are **out of scope** for the login:

- Signing up, or resetting a forgotten password.
- Adding, editing or deleting user accounts (only the demo data creates users).
- The Leave Request module itself – it is specified separately in §6–11 below.

---

## 6. The problem (Leave Request)

Budiman Company still processes leave on paper: the employee hands a form to
the supervisor, the supervisor signs it, HR receives a copy and types it into
a spreadsheet by hand. Forms get lost or delayed, employees cannot see where
their request is, and HR has no single list of requests waiting for a
decision.

The module replaces the paper form inside the HRMS: **one request, one
system, visible from submission to decision.** The agreed workflow: the
employee submits to a supervisor **in their own division**; the supervisor
signs or rejects (a rejection needs a reason); the employee then sends a
signed request to the shared **HR queue**; either HR officer approves or
rejects (a rejection needs a reason), and the officer who decides is
recorded. The admin sees every record and changes nothing. A rejection is
final — to try again the employee creates a fresh request. There is no
withdraw.

## 7. Who uses it (roles)

| Role | What they do with requests |
|------|----------------------------|
| **Employee** | Submits a request to a supervisor in their own division, tracks its status and remarks, and sends a signed request to HR. |
| **Supervisor** | Sees the requests sent to them; signs or rejects each one. A rejection needs a remark. |
| **HR** | Sees every request waiting for HR in one shared list; approves or rejects it. A rejection needs a remark; the officer who decides is recorded. |
| **Admin** | Sees every leave record. View only: changes nothing. |

## 8. User stories

Format: *As a [role], I can [do something] so that [benefit].*

Every story in this part is **Core**: the brief makes the whole chain
(employee → supervisor → HR → admin) core, and nothing was deferred to
"later". If time runs short we stop early rather than skip core checks
silently.

- **U6. Apply for leave** *(Core)*. As an Employee, I can submit a leave
  request for Annual or Sick leave with start and end dates, a supervisor from
  my own division, and an optional reason, so that I can ask for leave without
  paper.
- **U7. Track my requests** *(Core)*. As an Employee, I can see all my
  requests with their status and every remark, so that I always know where a
  request stands.
- **U8. Send a signed request to HR** *(Core)*. As an Employee, I can send a
  signed request to HR with one click, so that it enters the HR queue without
  chasing anyone.
- **U9. Decide on requests sent to me** *(Core)*. As a Supervisor, I can see
  the requests sent to me and sign or reject them (a rejection needs a reason),
  so that leave is checked before it reaches HR.
- **U10. One shared HR queue** *(Core)*. As an HR officer, I can see every
  request waiting for HR in one list and approve or reject it (a rejection
  needs a reason), so that no request gets lost.
- **U11. Decisions are attributed** *(Core)*. As an HR officer, the officer
  who approves or rejects a request is recorded on it, so every decision has
  an owner.
- **U12. See every record** *(Core)*. As an Admin, I can see every leave
  record with its remarks, so that I have the full picture without changing
  anything.

## 9. Acceptance checklist

The module is done when every box below is ticked, **on top of** the login
checks (AC-01–AC-09), starting from `npm run db:seed`: besides the users, the
seed creates seven sample requests (design §6) covering every status — two in
Waiting for Supervisor and one Signed from Employee 2, two in Waiting for HR
from Employee 1, one Approved and one Rejected.

The five statuses a request can hold: **Waiting for Supervisor** →
**Signed** (waiting for the employee to send it) → **Waiting for HR** →
**Approved**, and **Rejected** from either decision point. Duration counts
**working days only (Mon–Fri)**; weekends are skipped and there is no
public-holiday calendar.

| ✓ | ID | Check | How to test |
|---|----|-------|-------------|
| [ ] | AC-10 | An employee can submit a request that appears as Waiting for Supervisor. | Log in as `employee-2` → **New request** → Annual, start = next Monday, end = next Tuesday, supervisor = Supervisor 2, reason empty → confirm in the box → success message → the table shows the request at the top: Type Annual, Days **2**, Status Waiting for Supervisor. |
| [ ] | AC-11 | Empty or invalid dates are not sent. | Click **Submit** with the dates empty → the browser asks you to fill them. Set the end date before the start date → an error is shown and no request is created. |
| [ ] | AC-12 | The supervisor list shows only supervisors from my division. | As `employee-2` (Software Development) open **New request** → the supervisor choice lists only Supervisor 2; Supervisor 1 (Finance & Administration) is not offered. |
| [ ] | AC-13 | The day count skips weekends. | Submit a request from a Friday to the following Monday → Days shows **2**, not 4. |
| [ ] | AC-14 | A supervisor sees requests sent to them and can sign. | Log in as `supervisor-2` → Employee 2's Waiting for Supervisor request is in the list → open it → **Sign** → confirm → success message → status becomes Signed. |
| [ ] | AC-15 | A supervisor's rejection needs a reason. | As `supervisor-2`, press **Reject** on a request with the remark box empty → an error asks for a reason; type a reason → confirm → status Rejected; the reason is visible in the request's detail view. |
| [ ] | AC-16 | The employee sends a signed request to the shared HR queue. | Log in as `employee-2` → the Signed request offers **Send to HR** → confirm → success message → status Waiting for HR. Log in as `hr-1` → it is in the HR list; log in as `hr-2` → it is there too (shared queue). |
| [ ] | AC-17 | An HR approval records the officer who decided. | As `hr-1`, **Approve** the Waiting for HR request → confirm → success message → status Approved; the detail view shows the deciding officer "HR 1" (and your remark if you left one). |
| [ ] | AC-18 | Every HR officer sees what was decided. | Log in as `hr-2` → the same request shows status Approved with **HR 1** recorded as the deciding officer. |
| [ ] | AC-19 | An HR rejection needs a reason and reaches the employee. | As `hr-2`, reject another Waiting for HR request — empty remark is blocked, same as AC-15 → confirm → status Rejected. Log in as the request's employee → the reason shows in its detail view. |
| [ ] | AC-20 | An employee sees only their own requests. | Log in as `employee-2` → the table lists only employee-2's requests (nothing of employee-1); each detail view shows the reason and all remarks so far. |
| [ ] | AC-21 | Rejected is final, and there is no withdraw. | A Rejected request offers no edit, re-send or withdraw button. A Waiting for Supervisor request has no withdraw button either. The employee can create a fresh request instead. |
| [ ] | AC-22 | The admin sees every record and changes nothing. | Log in as `admin` → the table lists every request in the system, every status included, detail views show reason and remarks → there are **no action buttons anywhere** (no sign, reject, send, approve, withdraw, edit or delete). |
| [ ] | AC-23 | Every action asks first, then confirms. | For submit, sign, reject, send and approve → a confirmation box appears first; **Cancel** changes nothing; confirming shows a success message. |
| [ ] | AC-24 | The module obeys the login rules. | Log out and type an employee page address → sent to `/login`. As `supervisor-1`, type the new-request address → sent back to `/supervisor`. |

## 10. Not included (for now)

These are **out of scope** for the module:

- Leave balances or yearly quotas — the app counts the working days of a
  request but does not track what anyone is "allowed".
- A public-holiday calendar (weekends are skipped; holidays count as working
  days).
- File uploads (e.g. a medical certificate), email notifications, printing or
  exporting requests.
- Withdrawing a submitted request, and re-sending a rejected one (decided in
  the interview: a rejection is final; create a fresh request).
- The admin changing anything, and managing leave types or supervisors outside
  the demo data (Annual and Sick are fixed in code).

## 11. Assumptions

Things the interview did not ask outright, assumed as stated — if one is
wrong, fix it **here** first (the golden rule), then rebuild:

- Leave **in the past is allowed** — sick leave is often reported after the
  fact. Only an end date before the start date is rejected.
- Remarks are **optional when signing or approving**; required only when
  rejecting.
- The working-day count is computed by the **server** at submission and
  **stored on the request**, so every screen shows the same number.
- A request keeps the **one supervisor chosen at submission**; there is no
  re-assigning to another supervisor.
- The status names (**Waiting for Supervisor**, **Signed**, **Waiting for
  HR**, **Approved**, **Rejected**) and button labels (**Sign**, **Reject**,
  **Send to HR**, **Approve**) are as written in §9; wording changes start
  here, not in the code.
- `npm run db:seed` creates the **seven sample requests** listed above, with
  dates near the day the seed runs so the lists look current.
- Dates follow the company time zone already used in
  `src/lib/constants.ts`.
