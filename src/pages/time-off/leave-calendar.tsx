import * as React from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LeaveRequest, LeaveType } from "@/types/domain"

const legend: { status: "Approved" | "Pending" | "Rejected"; label: string; dot: string }[] = [
  { status: "Approved", label: "Validated", dot: "bg-df-success" },
  { status: "Pending", label: "To Approve", dot: "bg-df-warning" },
  { status: "Rejected", label: "Refused", dot: "bg-df-danger" },
]

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function LeaveCalendar({
  requests,
  leaveTypes,
}: {
  requests: LeaveRequest[]
  leaveTypes: LeaveType[]
}) {
  const [month, setMonth] = React.useState(() => startOfMonth(new Date()))

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const requestsOn = (day: Date) =>
    requests.filter((r) => {
      const d = format(day, "yyyy-MM-dd")
      return r.start_date <= d && d <= r.end_date
    })

  return (
    <div className="rounded-2xl border border-border bg-df-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-df-text">{format(month, "MMMM yyyy")}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-label py-1 text-df-text-subtle">
            {w}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const dayRequests = requestsOn(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex h-16 flex-col items-center gap-1 rounded-lg p-1.5",
                inMonth ? "bg-df-surface-alt" : "bg-transparent opacity-40",
                isToday(day) && "ring-1 ring-df-border-strong"
              )}
            >
              <span className={cn("text-xs", isToday(day) ? "font-semibold text-df-text" : "text-df-text-muted")}>
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap justify-center gap-0.5">
                {dayRequests.slice(0, 3).map((r) => {
                  const type = leaveTypes.find((t) => t.id === r.leave_type_id)
                  const dotClass =
                    r.status === "Approved" ? "bg-df-success" : r.status === "Pending" ? "bg-df-warning" : "bg-df-danger"
                  return (
                    <span
                      key={r.id}
                      className={cn("size-1.5 rounded-full", dotClass)}
                      aria-label={`${type?.name ?? "Leave"}: ${r.status}`}
                      title={`${type?.name ?? "Leave"}: ${r.status}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3">
        {legend.map((l) => (
          <div key={l.status} className="flex items-center gap-1.5 text-xs text-df-text-muted">
            <span className={cn("size-2 rounded-full", l.dot)} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
