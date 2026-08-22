import { format } from "date-fns"

import type { LeaveRequest } from "@/types/domain"

/** True if any approved request for this employee covers the given date, independent of whether an attendance row exists for that day (e.g. a leave spanning a weekend). */
export function isOnApprovedLeave(
  employeeId: string,
  date: Date,
  approvedRequests: LeaveRequest[]
): boolean {
  const d = format(date, "yyyy-MM-dd")
  return approvedRequests.some(
    (r) => r.employee_id === employeeId && r.status === "Approved" && r.start_date <= d && d <= r.end_date
  )
}
