// The Leave Request rule-book (docs/specs/02-design.md Part A, rules 8, 10, 13).
// Pure logic only — no database, no Next.js. Pages and server actions call
// these functions instead of repeating the rules.

import type { Role, LeaveStatus } from "./constants";
import { isLeaveStatus } from "./constants";
import { APP_TIME_ZONE } from "./constants";

// The five actions a viewer can take on an existing request (rule 10).
// (Creating a request is not here: only an Employee submits, and the
// submit action checks the role itself.)
export const LEAVE_ACTIONS = [
  "sign",
  "rejectSupervisor",
  "send",
  "approve",
  "rejectHr",
] as const;
export type LeaveAction = (typeof LEAVE_ACTIONS)[number];

export const LEAVE_ACTION_LABELS: Record<LeaveAction, string> = {
  sign: "Sign",
  rejectSupervisor: "Reject",
  send: "Send to HR",
  approve: "Approve",
  rejectHr: "Reject",
};

// --- Rule 8: working days -------------------------------------------------

// The calendar day (YYYY-MM-DD) of a moment, in the company time zone.
// Counting on these strings keeps the result the same on every laptop.
function toCalendarDay(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Count of Monday–Friday days between start and end, inclusive (rule 8).
// Weekends never count; there is no public-holiday calendar.
export function countWorkingDays(
  start: Date | string,
  end: Date | string,
): number {
  const startDay = toCalendarDay(start);
  const endDay = toCalendarDay(end);
  if (endDay < startDay) {
    // Rule 7: the end date is never before the start date.
    throw new Error("End date is before start date");
  }
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let cursor = new Date(`${startDay}T00:00:00Z`).getTime();
  const last = new Date(`${endDay}T00:00:00Z`).getTime();
  let days = 0;
  while (cursor <= last) {
    const weekday = new Date(cursor).getUTCDay(); // 0 = Sunday, 6 = Saturday
    if (weekday !== 0 && weekday !== 6) days += 1;
    cursor += MS_PER_DAY;
  }
  return days;
}

// --- Rule 10: allowed status changes ---------------------------------------

// The only moves a status may make. APPROVED and REJECTED are final.
export const ALLOWED_TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  WAITING_SUPERVISOR: ["SIGNED", "REJECTED"],
  SIGNED: ["WAITING_HR"],
  WAITING_HR: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export function canTransition(from: string, to: string): boolean {
  if (!isLeaveStatus(from) || !isLeaveStatus(to)) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// --- Rules 10 + 13: who may act, and who may see ---------------------------

// The pieces of a request (and of a user) the rules need. Kept small and
// structural so callers can pass a Prisma row without extra imports.
export type RequestRules = {
  status: string;
  employeeId: number;
  supervisorId: number;
};

export type Actor = { id: number; role: Role };

// The actions this actor may take on this request right now, as buttons in
// the order of the workflow. Screens show exactly these; server actions
// re-check with the same function before touching data.
export function allowedActions(
  actor: Actor,
  request: RequestRules,
): LeaveAction[] {
  const { status, employeeId, supervisorId } = request;
  const isSupervisor =
    actor.role === "SUPERVISOR" && actor.id === supervisorId;
  const isOwner = actor.role === "EMPLOYEE" && actor.id === employeeId;

  switch (status) {
    case "WAITING_SUPERVISOR":
      // Assigned supervisor only; the employee may not withdraw (rule 13).
      return isSupervisor ? ["sign", "rejectSupervisor"] : [];
    case "SIGNED":
      // The request's own employee only.
      return isOwner ? ["send"] : [];
    case "WAITING_HR":
      // Any HR officer — the one who acts gets recorded (rule 12).
      return actor.role === "HR" ? ["approve", "rejectHr"] : [];
    default:
      // APPROVED and REJECTED are final; the Admin never acts.
      return [];
  }
}

// Rule 13: who may see a row. Employees their own, supervisors only those
// naming them, HR and Admin every row. A page that fails this shows Not found.
export function canViewRequest(
  actor: Actor,
  request: RequestRules,
): boolean {
  switch (actor.role) {
    case "EMPLOYEE":
      return actor.id === request.employeeId;
    case "SUPERVISOR":
      return actor.id === request.supervisorId;
    case "HR":
    case "ADMIN":
      return true;
  }
}
