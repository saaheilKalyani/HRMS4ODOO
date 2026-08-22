import * as React from "react"
import { addDays, format, isWeekend } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { EmptyState } from "@/components/common/empty-state"
import { attendanceStatusMeta, StatusPill, type Tone } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { usePeople } from "@/features/employees/hooks"
import { useLeaveRequests } from "@/features/leave/hooks"
import { formatHours, formatTime } from "@/lib/format"
import { isOnApprovedLeave } from "@/lib/leave-utils"

export function AdminDailyView() {
  const [date, setDate] = React.useState(() => new Date())
  const [search, setSearch] = React.useState("")
  const dateStr = format(date, "yyyy-MM-dd")
  const dateIsWeekend = isWeekend(date)
  const dateIsPastOrToday = dateStr <= format(new Date(), "yyyy-MM-dd")

  const { data: people = [] } = usePeople()
  const { data: records = [], isLoading } = useAttendance({ from: dateStr, to: dateStr })
  const { data: approvedRequests = [] } = useLeaveRequests({ status: "approved" })

  const rows = people
    .map((p) => {
      const record = records.find((r) => r.employee_id === p.employee.id)
      const onLeave = !record && isOnApprovedLeave(p.employee.id, date, approvedRequests)
      let status: { tone: Tone; label: string }
      if (record) status = attendanceStatusMeta(record.status)
      else if (onLeave) status = { tone: "info", label: "On Leave" }
      else if (dateIsWeekend) status = { tone: "neutral", label: "Weekend" }
      else status = attendanceStatusMeta("absent")
      return { person: p, record, status }
    })
    .filter(({ person }) => person.employee.full_name.toLowerCase().includes(search.toLowerCase()))

  const missing = rows.filter((r) => !r.record && !dateIsWeekend && dateIsPastOrToday && r.status.label !== "On Leave").length

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setDate((d) => addDays(d, -1))}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="w-36 text-center text-sm font-medium text-df-text">{format(date, "EEE, d MMM yyyy")}</span>
          <Button variant="outline" size="icon-sm" onClick={() => setDate((d) => addDays(d, 1))}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-df-text-subtle" />
          <Input
            placeholder="Search employee…"
            className="h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {missing > 0 && (
        <p className="mb-3 text-xs text-df-text-subtle">{missing} employee(s) have no attendance record for this day.</p>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No employees found" description="Try a different search term." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ person, record, status }) => (
                <TableRow key={person.employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <AvatarInitials name={person.employee.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-df-text">{person.employee.full_name}</p>
                        <p className="truncate text-xs text-df-text-subtle">{person.employee.department}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatTime(record?.check_in)}</TableCell>
                  <TableCell className="tabular-nums">{formatTime(record?.check_out)}</TableCell>
                  <TableCell className="tabular-nums">{formatHours(record?.total_hours)}</TableCell>
                  <TableCell>
                    <StatusPill tone={status.tone} label={status.label} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
