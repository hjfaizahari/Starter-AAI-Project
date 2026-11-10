import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { formatTimestamp, todayIso } from "../src/lib/constants";
import { countWorkingDays } from "../src/lib/leave";

const prisma = new PrismaClient();

// The demo users (design §6). Every one logs in with the password "password123".
// Each name includes the user's division in brackets.
const USERS = [
  { email: "employee-1@budiman.com", name: "Employee 1 (Finance & Administration)", role: "EMPLOYEE", identificationNo: "00-148291", designation: "Administrative Officer", division: "Finance & Administration" },
  { email: "employee-2@budiman.com", name: "Employee 2 (Software Development)", role: "EMPLOYEE", identificationNo: "00-173604", designation: "Software Engineer", division: "Software Development" },
  { email: "supervisor-1@budiman.com", name: "Supervisor 1 (Finance & Administration)", role: "SUPERVISOR", identificationNo: "00-159827", designation: "Team Lead", division: "Finance & Administration" },
  { email: "supervisor-2@budiman.com", name: "Supervisor 2 (Software Development)", role: "SUPERVISOR", identificationNo: "00-126418", designation: "Team Lead", division: "Software Development" },
  { email: "hr-1@budiman.com", name: "HR 1 (Human Resources)", role: "HR", identificationNo: "00-191356", designation: "HR Officer", division: "Human Resources" },
  { email: "hr-2@budiman.com", name: "HR 2 (Human Resources)", role: "HR", identificationNo: "00-184072", designation: "HR Officer", division: "Human Resources" },
  { email: "admin@budiman.com", name: "Admin (Management)", role: "ADMIN", identificationNo: "00-105739", designation: "Director", division: "Management" },
];

// The seven sample requests (design §6), covering every status so the module
// checks (AC-10–AC-24) can run from a clean seed. Dates sit close to the day
// the seed runs (last week and next week), so every list looks current.
type SeedRequest = {
  employee: string;
  supervisor: string;
  type: "ANNUAL" | "SICK";
  start: Date;
  end: Date;
  status: "WAITING_SUPERVISOR" | "SIGNED" | "WAITING_HR" | "APPROVED" | "REJECTED";
  reason?: string;
  supervisorRemark?: string;
  hrRemark?: string;
  decidedByHr?: string;
};

// A Date for the company-time-zone day n shifts from today (stored as UTC
// midnight, which is the same calendar day in Asia/Brunei).
function shiftDay(days: number): Date {
  const d = new Date(`${todayIso()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Days elapsed since this week's Monday (Sunday counts as day 6).
function daysSinceMondayStart(): number {
  const dow = new Date(`${todayIso()}T00:00:00Z`).getUTCDay();
  return (dow + 6) % 7;
}

// A weekday (1 = Mon … 5 = Fri) inside whole week `weeksAgo` back (1 = last
// week). Anchoring to whole weeks keeps every start/end pair inside the same
// week, so an end date can never land before its start date.
function lastWeekday(weekday: number, weeksAgo = 1): Date {
  return shiftDay(-(daysSinceMondayStart() + 7 * weeksAgo) + (weekday - 1));
}

// A weekday (1 = Mon … 5 = Fri) in the coming whole week.
function nextWeekday(weekday: number): Date {
  return shiftDay(7 - daysSinceMondayStart() + (weekday - 1));
}

async function main() {
  // Reset the data so the seed is repeatable. Requests go first: their rows
  // point at users, so the foreign keys must be freed before deleting users.
  await prisma.leaveRequest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  for (const user of USERS) {
    await prisma.user.create({ data: { ...user, passwordHash } });
  }
  const idByEmail = new Map(
    (await prisma.user.findMany()).map((u) => [u.email, u.id]),
  );
  const uid = (email: string): number => {
    const id = idByEmail.get(email);
    if (id === undefined) throw new Error(`Seed: unknown user ${email}`);
    return id;
  };

  console.log(`Seeded ${USERS.length} demo users (password: password123):`);
  for (const user of USERS) console.log(`  ${user.email.padEnd(26)} ${user.role}`);

  const e1 = "employee-1@budiman.com";
  const e2 = "employee-2@budiman.com";
  const s1 = "supervisor-1@budiman.com";
  const s2 = "supervisor-2@budiman.com";
  const hr2 = "hr-2@budiman.com";

  const nextMon = nextWeekday(1);
  const nextTue = nextWeekday(2);
  const nextWed = nextWeekday(3);
  const nextThu = nextWeekday(4);
  const nextFri = nextWeekday(5);
  const lastMon = lastWeekday(1);
  const lastTue = lastWeekday(2);
  const lastWed = lastWeekday(3);
  const lastThu = lastWeekday(4);
  const lastFri = lastWeekday(5);
  const longAgoMon = lastWeekday(1, 2); // two weeks ago
  const longAgoTue = lastWeekday(2, 2);

  const REQUESTS: SeedRequest[] = [
    // AC-14 — supervisor signs one of these; AC-15 — rejects the other.
    { employee: e2, supervisor: s2, type: "ANNUAL", start: nextMon, end: nextTue, status: "WAITING_SUPERVISOR", reason: "Family visit." },
    { employee: e2, supervisor: s2, type: "SICK", start: nextWed, end: nextThu, status: "WAITING_SUPERVISOR" }, // no reason — the field is optional
    // AC-16 — the employee sends this one to HR.
    { employee: e2, supervisor: s2, type: "ANNUAL", start: nextMon, end: nextFri, status: "SIGNED", reason: "Conference travel.", supervisorRemark: "Signed — team cover arranged." },
    // AC-17/18 — hr-1 approves it; AC-19 — hr-2 rejects the next one.
    { employee: e1, supervisor: s1, type: "ANNUAL", start: lastMon, end: lastTue, status: "WAITING_HR", supervisorRemark: "Signed." },
    { employee: e1, supervisor: s1, type: "SICK", start: lastWed, end: lastThu, status: "WAITING_HR", reason: "Flu." },
    // AC-22 — finished content for the Admin list.
    { employee: e1, supervisor: s1, type: "ANNUAL", start: lastMon, end: lastFri, status: "APPROVED", reason: "Annual family leave.", supervisorRemark: "Signed.", hrRemark: "Approved — annual leave granted.", decidedByHr: hr2 },
    // AC-21 — a final rejection with a remark for the employee to read.
    { employee: e2, supervisor: s2, type: "SICK", start: longAgoMon, end: longAgoTue, status: "REJECTED", supervisorRemark: "Team is already short-staffed that week — please rebook." },
  ];

  for (const r of REQUESTS) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: uid(r.employee),
        supervisorId: uid(r.supervisor),
        type: r.type,
        startDate: r.start,
        endDate: r.end,
        workingDays: countWorkingDays(r.start, r.end), // rule 8: the helper does the counting
        reason: r.reason ?? "",
        status: r.status,
        supervisorRemark: r.supervisorRemark ?? "",
        hrRemark: r.hrRemark ?? "",
        decidedByHrId: r.decidedByHr ? uid(r.decidedByHr) : null,
      },
    });
  }

  console.log(`Seeded ${REQUESTS.length} sample leave requests:`);
  for (const r of REQUESTS) {
    console.log(
      `  ${r.status.padEnd(21)} ${r.type.padEnd(6)} ${formatTimestamp(r.start)} – ${formatTimestamp(r.end)} (${countWorkingDays(r.start, r.end)} days) ${r.employee.split("@")[0]} -> ${r.supervisor.split("@")[0]}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
