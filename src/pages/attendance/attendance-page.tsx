import * as React from "react"

import { PageHeader } from "@/components/common/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/auth-context"
import { usePeople } from "@/features/employees/hooks"
import { AdminDailyView } from "@/pages/attendance/admin-daily-view"
import { EmployeeMonthView } from "@/pages/attendance/employee-month-view"

export default function AttendancePage() {
  const { user } = useAuth()
  const isManager = user?.profile.role === "admin" || user?.profile.role === "hr"
  const { data: people = [] } = usePeople()

  const [view, setView] = React.useState<"daily" | "employee">("daily")
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null)

  if (!user) return null

  if (!isManager) {
    return (
      <div>
        <PageHeader title="My Attendance" description="Your check-in history and monthly summary." />
        <EmployeeMonthView employeeId={user.employee.id} />
      </div>
    )
  }

  const effectiveEmployeeId = selectedEmployeeId ?? people[0]?.employee.id ?? null

  return (
    <div>
      <PageHeader title="Attendance" description="Review attendance across the organization." />

      <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "employee")} className="mb-5">
        <TabsList variant="line">
          <TabsTrigger value="daily">Daily overview</TabsTrigger>
          <TabsTrigger value="employee">By employee</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "daily" ? (
        <AdminDailyView />
      ) : (
        <div>
          <div className="mb-4 w-64">
            <Select value={effectiveEmployeeId ?? undefined} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.employee.id} value={p.employee.id}>
                    {p.employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {effectiveEmployeeId && <EmployeeMonthView employeeId={effectiveEmployeeId} />}
        </div>
      )}
    </div>
  )
}
