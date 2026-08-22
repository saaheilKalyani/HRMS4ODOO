import { format, startOfMonth } from "date-fns"
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  ClockIcon,
  PlaneTakeoffIcon,
  WalletIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { attendanceStatusMeta, leaveStatusMeta, StatusPill } from "@/components/common/status-badge"
import { StatCard } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckInOutWidget } from "@/features/attendance/checkin-widget"
import { useAttendance, useTodayAttendance } from "@/features/attendance/hooks"
import { useAuth } from "@/features/auth/AuthContext"
import { useLeaveBalances, useLeaveRequests, useLeaveTypes } from "@/features/leave/hooks"
import { useEmployeeDashboard } from "@/features/reports/hooks"
import { countWeekdays } from "@/lib/date-utils"
import { formatCurrency, formatDateShort, formatTime } from "@/lib/format"
import { timeGreeting } from "@/lib/greeting"
import { paths } from "@/routes/paths"

export function EmployeeDashboard() {
  const { user } = useAuth()
  const employeeId = user!.employee.id
  const firstName = user!.profile.display_name.split(" ")[0]

  const monthStart = startOfMonth(new Date())
  const monthStartStr = format(monthStart, "yyyy-MM-dd")

  const { data: dashboard } = useEmployeeDashboard()
  const today = dashboard?.todayAttendance ?? null
  const salary = dashboard?.salarySummary ?? null
  const { data: monthAttendance = [], isLoading: attendanceLoading } = useAttendance({
    employeeId,
    from: monthStartStr,
  })
  const { data: recentRequests = [] } = useLeaveRequests({ employeeId })
  const { data: balances = [] } = useLeaveBalances(employeeId)
  const { data: leaveTypes = [] } = useLeaveTypes()

  const presentDays = monthAttendance.filter((r) => r.status === "Present" || r.status === "Half-day").length
  const leaveDays = monthAttendance.filter((r) => r.status === "Leave").length
  const workingDaysSoFar = countWeekdays(monthStart, new Date())
  const paidBalance = balances.find((b) => b.leave_type_id === "lt-paid")
  const pendingCount = recentRequests.filter((r) => r.status === "Pending").length

  const todayMeta = today ? attendanceStatusMeta(today.status) : null

  return (
    <div>
      <PageHeader
        title={`${timeGreeting()}, ${firstName}`}
        description={`${user!.employee.job_title ?? "—"} · ${user!.employee.department ?? "—"} · Dayflow Technologies`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={today?.check_in ? formatTime(today.check_in) : "Not checked in"}
          icon={<ClockIcon className="size-4" />}
          trend={
            todayMeta
              ? { direction: today?.status === "Present" ? "up" : "down", label: todayMeta.label }
              : undefined
          }
        />
        <StatCard
          label="Present this month"
          value={`${presentDays}/${workingDaysSoFar}`}
          icon={<CalendarCheckIcon className="size-4" />}
        />
        <StatCard
          label="Paid leave balance"
          value={paidBalance ? `${paidBalance.allocated_days - paidBalance.used_days} days` : "—"}
          icon={<PlaneTakeoffIcon className="size-4" />}
        />
        <StatCard
          label="Net pay"
          value={salary ? formatCurrency(salary.net_salary) : "—"}
          icon={<WalletIcon className="size-4" />}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Attendance</CardTitle>
              <Button variant="ghost" size="sm" render={<Link to={paths.attendance} />}>
                View all <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-df-text-muted">
                  {today?.check_in
                    ? today.check_out
                      ? `Checked out at ${formatTime(today.check_out)}`
                      : `Checked in at ${formatTime(today.check_in)}`
                    : "You haven't checked in yet today."}
                </p>
                {leaveDays > 0 && (
                  <p className="mt-1 text-xs text-df-text-subtle">{leaveDays} leave day(s) this month</p>
                )}
              </div>
              <CheckInOutWidget />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {attendanceLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : monthAttendance.length === 0 ? (
                <EmptyState title="No attendance yet" description="Check in to start building your history." />
              ) : (
                monthAttendance.slice(0, 6).map((r) => {
                  const meta = attendanceStatusMeta(r.status)
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-df-surface-alt"
                    >
                      <span className="w-20 text-df-text-muted">{formatDateShort(r.attendance_date)}</span>
                      <span className="flex-1 text-df-text tabular-nums">
                        {formatTime(r.check_in)} – {formatTime(r.check_out)}
                      </span>
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Time off</CardTitle>
              <Button variant="ghost" size="sm" render={<Link to={paths.timeOff} />}>
                Apply <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingCount > 0 && (
                <p className="mb-2 text-xs text-df-text-subtle">{pendingCount} request(s) awaiting approval</p>
              )}
              {recentRequests.length === 0 ? (
                <p className="text-sm text-df-text-muted">No leave requests yet.</p>
              ) : (
                recentRequests.slice(0, 3).map((r) => {
                  const meta = leaveStatusMeta(r.status)
                  const type = leaveTypes.find((t) => t.id === r.leave_type_id)
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-df-text">{type?.name ?? "Leave"}</p>
                        <p className="text-xs text-df-text-subtle">
                          {formatDateShort(r.start_date)} – {formatDateShort(r.end_date)}
                        </p>
                      </div>
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto flex-col items-start gap-1 py-3" render={<Link to={paths.profile} />}>
                <span className="text-sm font-medium">My Profile</span>
                <span className="text-xs font-normal text-df-text-muted">View & edit</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start gap-1 py-3" render={<Link to={paths.profile} />}>
                <span className="text-sm font-medium">My Salary</span>
                <span className="text-xs font-normal text-df-text-muted">View summary</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
