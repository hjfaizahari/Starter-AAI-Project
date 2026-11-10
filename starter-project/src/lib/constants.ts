// Shared constants and helpers for the Budiman HRMS starter app.
// Roles, leave types and leave statuses are plain string unions (SQLite has
// no enums); the app checks values against the lists below (design rule 6).

export const ROLES = ["EMPLOYEE", "SUPERVISOR", "HR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Employee",
  SUPERVISOR: "Supervisor",
  HR: "HR",
  ADMIN: "Admin",
};

// Every account uses a company email address.
export const EMAIL_DOMAIN = "budiman.com";

// The divisions and designations a user can have. Stored as plain text on the user.
export const DIVISIONS = [
  "Software Development",
  "Quality Assurance",
  "IT Infrastructure & Operations",
  "Cybersecurity",
  "Data & Analytics",
  "Product & Design",
  "Customer Support",
  "Human Resources",
  "Finance & Administration",
  "Management",
] as const;

export const DESIGNATIONS = [
  "Software Engineer",
  "QA Engineer",
  "System Administrator",
  "IT Support Technician",
  "Data Analyst",
  "UI/UX Designer",
  "Team Lead",
  "HR Officer",
  "Administrative Officer",
  "Director",
] as const;

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

// The two kinds of leave a request can be for (design rule 6). No screen
// manages these — they are fixed here.
export const LEAVE_TYPES = ["ANNUAL", "SICK"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual",
  SICK: "Sick",
};

export function isLeaveType(value: string): value is LeaveType {
  return (LEAVE_TYPES as readonly string[]).includes(value);
}

// The five statuses a request can hold (design rule 10).
// WAITING_SUPERVISOR -> SIGNED -> WAITING_HR -> APPROVED,
// REJECTED from either decision point; APPROVED and REJECTED are final.
export const LEAVE_STATUSES = [
  "WAITING_SUPERVISOR",
  "SIGNED",
  "WAITING_HR",
  "APPROVED",
  "REJECTED",
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  WAITING_SUPERVISOR: "Waiting for Supervisor",
  SIGNED: "Signed",
  WAITING_HR: "Waiting for HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function isLeaveStatus(value: string): value is LeaveStatus {
  return (LEAVE_STATUSES as readonly string[]).includes(value);
}

// The company's time zone. It decides what "today" is and how dates are shown.
export const APP_TIME_ZONE = "Asia/Brunei";

// Today's date in the company time zone, as a YYYY-MM-DD string.
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Format a moment in time (e.g. submittedAt) as DD-MM-YYYY in the company time zone.
export function formatTimestamp(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(d)
    .replaceAll("/", "-");
}
