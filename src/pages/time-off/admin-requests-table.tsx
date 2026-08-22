import * as React from "react"
import { CheckIcon, SearchIcon, XIcon } from "lucide-react"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { EmptyState } from "@/components/common/empty-state"
import { leaveStatusMeta, StatusPill } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePeople } from "@/features/employees/hooks"
import { useLeaveRequests, useLeaveTypes } from "@/features/leave/hooks"
import { formatDate } from "@/lib/format"
import { DecisionDialog } from "@/pages/time-off/decision-dialog"
import type { LeaveDecision, LeaveStatus } from "@/types/domain"

export function AdminRequestsTable() {
  const { data: requests = [], isLoading } = useLeaveRequests()
  const { data: people = [] } = usePeople()
  const { data: leaveTypes = [] } = useLeaveTypes()
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<LeaveStatus | "all">("all")
  const [dialog, setDialog] = React.useState<{ requestId: string; decision: LeaveDecision; name: string } | null>(null)

  const employeeName = (id: string) => people.find((p) => p.employee.id === id)?.employee.full_name ?? "Unknown"

  const rows = requests
    .filter((r) => status === "all" || r.status === status)
    .filter((r) => employeeName(r.employee_id).toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-df-text-subtle" />
          <Input
            placeholder="Search employee…"
            className="h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as LeaveStatus | "all")}>
          <SelectTrigger className="h-9 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No requests found" description="Try a different search or filter." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const meta = leaveStatusMeta(r.status)
                const type = leaveTypes.find((t) => t.id === r.leave_type_id)
                const name = employeeName(r.employee_id)
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials name={name} size="sm" />
                        <span className="text-sm font-medium text-df-text">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{type?.name}</TableCell>
                    <TableCell>{formatDate(r.start_date)}</TableCell>
                    <TableCell>{formatDate(r.end_date)}</TableCell>
                    <TableCell>
                      <StatusPill tone={meta.tone} label={meta.label} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pending" ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-df-success hover:bg-df-success-soft"
                            aria-label="Approve"
                            onClick={() => setDialog({ requestId: r.id, decision: "Approved", name })}
                          >
                            <CheckIcon />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="text-df-danger hover:bg-df-danger-soft"
                            aria-label="Reject"
                            onClick={() => setDialog({ requestId: r.id, decision: "Rejected", name })}
                          >
                            <XIcon />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-df-text-subtle">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {dialog && (
        <DecisionDialog
          requestId={dialog.requestId}
          employeeName={dialog.name}
          decision={dialog.decision}
          open={!!dialog}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </div>
  )
}
