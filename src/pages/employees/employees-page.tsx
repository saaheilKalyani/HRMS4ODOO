import * as React from "react"
import { format, isWeekend } from "date-fns"
import { PlaneTakeoffIcon, SearchIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttendance } from "@/features/attendance/hooks"
import { useAuth } from "@/features/auth/auth-context"
import { usePeople } from "@/features/employees/hooks"
import { useLeaveRequests } from "@/features/leave/hooks"
import { NewEmployeeSheet } from "@/pages/employees/new-employee-sheet"
import { departments } from "@/lib/constants/departments"
import { isOnApprovedLeave } from "@/lib/leave-utils"
import { paths } from "@/routes/paths"

const now = new Date()
const today = format(now, "yyyy-MM-dd")
const todayIsWorkingDay = !isWeekend(now)

export default function EmployeesPage() {
  const { user } = useAuth()
  const { data: people = [], isLoading } = usePeople()
  const { data: todayAttendance = [] } = useAttendance({ from: today, to: today })
  const { data: approvedRequests = [] } = useLeaveRequests({ status: "approved" })
  const [search, setSearch] = React.useState("")
  const [department, setDepartment] = React.useState<string>("all")

  const statusFor = (employeeId: string) => {
    if (isOnApprovedLeave(employeeId, now, approvedRequests)) return "leave" as const
    const record = todayAttendance.find((r) => r.employee_id === employeeId)
    if (record?.status === "present" || record?.status === "half_day") return "present" as const
    return todayIsWorkingDay ? ("absent" as const) : ("off" as const)
  }

  const filtered = people.filter((p) => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      p.employee.full_name.toLowerCase().includes(q) ||
      p.employee.job_title.toLowerCase().includes(q) ||
      p.employee.department.toLowerCase().includes(q)
    const matchesDept = department === "all" || p.employee.department === department
    return matchesSearch && matchesDept
  })

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description={`${people.length} people across Dayflow Technologies`}
        actions={user ? <NewEmployeeSheet currentUserRole={user.profile.role} /> : null}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-df-text-subtle" />
          <Input
            placeholder="Search by name, title, or department…"
            className="h-10 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={department} onValueChange={(v) => setDepartment((v as string) ?? "all")}>
          <SelectTrigger className="h-10 w-full sm:w-52">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No employees found" description="Try a different search term or department filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => {
            const status = statusFor(p.employee.id)
            return (
              <Link key={p.employee.id} to={paths.employee(p.employee.id)}>
                <Card className="h-full items-center gap-2 text-center transition-shadow hover:shadow-df-md">
                  <div className="relative">
                    <AvatarInitials name={p.employee.full_name} size="lg" className="size-14" />
                    {status === "present" && (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-df-success ring-2 ring-df-surface" />
                    )}
                    {status === "leave" && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-df-info text-white ring-2 ring-df-surface">
                        <PlaneTakeoffIcon className="size-3" />
                      </span>
                    )}
                    {status === "absent" && (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-df-warning ring-2 ring-df-surface" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-df-text">{p.employee.full_name}</p>
                    <p className="truncate text-xs text-df-text-muted">{p.employee.job_title}</p>
                  </div>
                  <span className="rounded-full bg-df-surface-alt px-2.5 py-0.5 text-xs text-df-text-muted">
                    {p.employee.department}
                  </span>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
