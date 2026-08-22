import * as React from "react"
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { attendanceStatusMeta, StatusPill } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAttendance } from "@/features/attendance/hooks"
import { countWeekdays } from "@/lib/date-utils"
import { formatDate, formatHours, formatTime } from "@/lib/format"

export function EmployeeMonthView({ employeeId }: { employeeId: string }) {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()))
  const monthEnd = endOfMonth(month)
  const isCurrent = isSameMonth(month, new Date())

  const { data: records = [], isLoading } = useAttendance({
    employeeId,
    from: format(month, "yyyy-MM-dd"),
    to: format(monthEnd, "yyyy-MM-dd"),
  })

  const presentDays = records.filter((r) => r.status === "present" || r.status === "half_day").length
  const leaveDays = records.filter((r) => r.status === "leave").length
  const workingDays = countWeekdays(month, isCurrent ? new Date() : monthEnd)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="w-36 text-center text-sm font-medium text-df-text">{format(month, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card size="sm">
          <p className="text-label text-df-text-subtle">Days present</p>
          <p className="text-h1 mt-1 text-df-text tabular-nums">{presentDays}</p>
        </Card>
        <Card size="sm">
          <p className="text-label text-df-text-subtle">Leave days</p>
          <p className="text-h1 mt-1 text-df-text tabular-nums">{leaveDays}</p>
        </Card>
        <Card size="sm">
          <p className="text-label text-df-text-subtle">Working days</p>
          <p className="text-h1 mt-1 text-df-text tabular-nums">{workingDays}</p>
        </Card>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No records this month" description="Attendance will show up here once recorded." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Extra Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const meta = attendanceStatusMeta(r.status)
                const extra = r.total_hours && r.total_hours > 8 ? r.total_hours - 8 : 0
                return (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.attendance_date)}</TableCell>
                    <TableCell className="tabular-nums">{formatTime(r.check_in)}</TableCell>
                    <TableCell className="tabular-nums">{formatTime(r.check_out)}</TableCell>
                    <TableCell className="tabular-nums">{formatHours(r.total_hours)}</TableCell>
                    <TableCell className="tabular-nums">{extra > 0 ? formatHours(extra) : "—"}</TableCell>
                    <TableCell>
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
