import { LEAVE_STATUS_LABELS, isLeaveStatus, type LeaveStatus } from "@/lib/constants";

// One colour per leave request status, shared by every role's table and detail
// view (design: StatusBadge is the only new ui/ building block).
const BADGE_STYLES: Record<LeaveStatus, string> = {
  WAITING_SUPERVISOR: "bg-amber-50 text-amber-700 ring-amber-200",
  SIGNED: "bg-blue-50 text-blue-700 ring-blue-200",
  WAITING_HR: "bg-violet-50 text-violet-700 ring-violet-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

// An unexpected database value still renders, in plain grey with its raw text.
export function StatusBadge({ status }: { status: string }) {
  const known = isLeaveStatus(status);
  const label = known ? LEAVE_STATUS_LABELS[status] : status;
  const style = known ? BADGE_STYLES[status] : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
