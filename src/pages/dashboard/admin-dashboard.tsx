import * as React from "react"
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  ClockIcon,
  PlaneTakeoffIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from "lucide-react"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { Link } from "react-router-dom"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { PageHeader } from "@/components/common/page-header"
import { attendanceStatusMeta, StatusPill } from "@/components/common/status-badge"
import { StatCard } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { useAttendance } from "@/features/attendance/hooks"
import { useAuth } from "@/features/auth/AuthContext"
import { useDecideLeaveRequest, useLeaveRequests, useLeaveTypes } from "@/features/leave/hooks"
import { usePeople } from "@/features/employees/hooks"
import { weeklyAttendanceBuckets } from "@/lib/analytics"
import { formatDateShort, formatTime } from "@/lib/format"
import { isOnApprovedLeave } from "@/lib/leave-utils"
import { timeGreeting } from "@/lib/greeting"
import { paths } from "@/routes/paths"

const today = format(new Date(), "yyyy-MM-dd")

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-df-surface px-3 py-2 text-xs shadow-df-md">
      <p className="mb-1 font-medium text-df-text">Week of {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-df-text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function AdminDashboard() {
  const { user } = useAuth()
  const firstName = user!.profile.display_name.split(" ")[0]

  const { data: people = [] } = usePeople()
  const { data: todayAttendance = [] } = useAttendance({ from: today, to: today })
  const { data: allRecent = [] } = useAttendance()
  const { data: pendingRequests = [] } = useLeaveRequests({ status: "Pending" })
  const { data: approvedRequests = [] } = useLeaveRequests({ status: "Approved" })
  const { data: leaveTypes = [] } = useLeaveTypes()
  const decide = useDecideLeaveRequest()
  const [decidingId, setDecidingId] = React.useState<string | null>(null)

  const now = new Date()
  const totalEmployees = people.length
  const presentToday = todayAttendance.filter((r) => r.status === "Present" || r.status === "Half-day").length
  const onLeaveToday = people.filter((p) => isOnApprovedLeave(p.employee.id, now, approvedRequests)).length
  const chartData = React.useMemo(() => weeklyAttendanceBuckets(allRecent), [allRecent])

  const employeeName = (employeeId: string) =>
    people.find((p) => p.employee.id === employeeId)?.employee.full_name ?? "Unknown"

  const handleDecide = async (requestId: string, decision: "Approved" | "Rejected") => {
    setDecidingId(requestId)
    try {
      await decide.mutateAsync({
        requestId,
        decision,
        comment: decision === "Approved" ? "Approved from dashboard." : "Rejected from dashboard.",
        approverId: user!.profile.id,
      })
    } finally {
      setDecidingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title={`${timeGreeting()}, ${firstName}`}
        description="Here's what's happening across Dayflow Technologies today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={totalEmployees} icon={<UsersIcon className="size-4" />} />
        <StatCard label="Present today" value={presentToday} icon={<ClockIcon className="size-4" />} />
        <StatCard label="On leave today" value={onLeaveToday} icon={<PlaneTakeoffIcon className="size-4" />} />
        <StatCard
          label="Pending leave requests"
          value={pendingRequests.length}
          icon={<CalendarCheckIcon className="size-4" />}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly attendance</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--df-border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--df-text-subtle)", fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--df-surface-alt)" }} />
                <Bar dataKey="present" name="Present" fill="var(--df-accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="away" name="Absent / Leave" fill="var(--df-warning)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pending approvals</CardTitle>
            <Button variant="ghost" size="sm" render={<Link to={paths.timeOff} />}>
              View all <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {pendingRequests.length === 0 ? (
              <EmptyState title="All caught up" description="No pending leave requests." />
            ) : (
              pendingRequests.slice(0, 4).map((r) => {
                const type = leaveTypes.find((t) => t.id === r.leave_type_id)
                return (
                  <div key={r.id} className="flex items-center gap-2 rounded-lg px-1 py-2">
                    <AvatarInitials name={employeeName(r.employee_id)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-df-text">{employeeName(r.employee_id)}</p>
                      <p className="truncate text-xs text-df-text-subtle">
                        {type?.name} · {formatDateShort(r.start_date)}–{formatDateShort(r.end_date)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, "Approved")}
                        aria-label="Approve"
                        className="text-df-success hover:bg-df-success-soft"
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        disabled={decidingId === r.id}
                        onClick={() => handleDecide(r.id, "Rejected")}
                        aria-label="Reject"
                        className="text-df-danger hover:bg-df-danger-soft"
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent attendance</CardTitle>
            <Button variant="ghost" size="sm" render={<Link to={paths.attendance} />}>
              View all <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {allRecent.slice(0, 6).map((r) => {
              const meta = attendanceStatusMeta(r.status)
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-df-surface-alt">
                  <AvatarInitials name={employeeName(r.employee_id)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-df-text">{employeeName(r.employee_id)}</p>
                    <p className="text-xs text-df-text-subtle">{formatDateShort(r.attendance_date)}</p>
                  </div>
                  <span className="hidden text-xs text-df-text-muted tabular-nums sm:block">
                    {formatTime(r.check_in)} – {formatTime(r.check_out)}
                  </span>
                  <StatusPill tone={meta.tone} label={meta.label} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="h-auto justify-start gap-2 py-3" render={<Link to={paths.employees} />}>
              <UsersIcon className="size-4" />
              Employee Directory
            </Button>
            <Button variant="outline" className="h-auto justify-start gap-2 py-3" render={<Link to={paths.timeOff} />}>
              <PlaneTakeoffIcon className="size-4" />
              Leave Management
            </Button>
            {user!.profile.role === "admin" && (
              <Button variant="outline" className="h-auto justify-start gap-2 py-3" render={<Link to={paths.salary} />}>
                <WalletIcon className="size-4" />
                Payroll Visibility
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
