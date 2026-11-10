import type { LeaveRequest } from "@prisma/client";
import { formatTimestamp, LEAVE_TYPE_LABELS, isLeaveType } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

// The request list shared by every role's home page (design: one RequestTable
// for all roles). The caller decides which rows to pass and in what order.
// Rows are plain text for now; the employee row links arrive with Task 12.
export function RequestTable({ requests }: { requests: LeaveRequest[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Dates</th>
            <th className="px-5 py-3">Days</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Submitted on</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-slate-100 last:border-b-0">
              <td className="px-5 py-3 font-medium text-slate-900">
                {isLeaveType(request.type) ? LEAVE_TYPE_LABELS[request.type] : request.type}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                {formatTimestamp(request.startDate)} – {formatTimestamp(request.endDate)}
              </td>
              <td className="px-5 py-3 text-slate-700">{request.workingDays}</td>
              <td className="px-5 py-3">
                <StatusBadge status={request.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                {formatTimestamp(request.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
