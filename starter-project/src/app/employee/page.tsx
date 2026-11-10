import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardIcon } from "@/components/ui/Icons";
import { RequestTable } from "@/components/leave/RequestTable";

// The Employee home page: the employee's own requests, newest first (design
// Part B). Only Employee users can open it (rule 13); the query already
// filters by the logged-in user, so nothing of anyone else can appear.
export default async function EmployeePage() {
  const user = await requireRole("EMPLOYEE");

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="My leave requests"
        description="Requests you have made, newest first."
      />

      <Card>
        <CardHeader title="Requests" count={requests.length} icon={<ClipboardIcon />} />
        {requests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="When you make a leave request it will appear here."
          />
        ) : (
          <RequestTable requests={requests} />
        )}
      </Card>
    </>
  );
}
