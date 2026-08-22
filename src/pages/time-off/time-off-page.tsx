import { PageHeader } from "@/components/common/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/auth-context"
import { useLeaveBalances, useLeaveRequests, useLeaveTypes } from "@/features/leave/hooks"
import { AdminRequestsTable } from "@/pages/time-off/admin-requests-table"
import { AllocationTable } from "@/pages/time-off/allocation-table"
import { LeaveCalendar } from "@/pages/time-off/leave-calendar"
import { NewRequestSheet } from "@/pages/time-off/new-request-sheet"

export default function TimeOffPage() {
  const { user } = useAuth()
  const isManager = user?.profile.role === "admin" || user?.profile.role === "hr"

  const { data: leaveTypes = [] } = useLeaveTypes()
  const { data: myRequests = [] } = useLeaveRequests({ employeeId: user?.employee.id })
  const { data: balances = [] } = useLeaveBalances(user?.employee.id)

  if (!user) return null

  return (
    <div>
      <PageHeader title="Time Off" description="Apply for leave and track requests." actions={<NewRequestSheet />} />

      <div className="mb-5 flex flex-wrap gap-3">
        {leaveTypes.map((t) => {
          const balance = balances.find((b) => b.leave_type_id === t.id)
          const remaining = balance ? balance.allocated_days - balance.used_days : 0
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-df-surface px-4 py-3 shadow-df-sm">
              <p className="text-xs text-df-text-muted">{t.name}</p>
              <p className="text-sm font-semibold text-df-text tabular-nums">
                {balance && balance.allocated_days < 0 ? "Unlimited" : `${Math.max(remaining, 0)} Days Available`}
              </p>
            </div>
          )
        })}
      </div>

      {isManager ? (
        <Tabs defaultValue="time-off">
          <TabsList variant="line" className="mb-5">
            <TabsTrigger value="time-off">Time Off</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
          </TabsList>
          <TabsContent value="time-off" className="space-y-6">
            <LeaveCalendar requests={myRequests} leaveTypes={leaveTypes} />
            <div>
              <h2 className="text-h2 mb-3 text-df-text">All requests</h2>
              <AdminRequestsTable />
            </div>
          </TabsContent>
          <TabsContent value="allocation">
            <AllocationTable />
          </TabsContent>
        </Tabs>
      ) : (
        <LeaveCalendar requests={myRequests} leaveTypes={leaveTypes} />
      )}
    </div>
  )
}
