import { AvatarInitials } from "@/components/common/avatar-initials"
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
import { usePeople } from "@/features/employees/hooks"
import { useAllLeaveBalances, useLeaveTypes } from "@/features/leave/hooks"

export function AllocationTable() {
  const { data: people = [], isLoading: peopleLoading } = usePeople()
  const { data: leaveTypes = [], isLoading: typesLoading } = useLeaveTypes()
  const { data: balances = [], isLoading: balancesLoading } = useAllLeaveBalances()

  if (peopleLoading || typesLoading || balancesLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            {leaveTypes.map((t) => (
              <TableHead key={t.id} className="text-right">
                {t.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((p) => (
            <TableRow key={p.employee.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <AvatarInitials name={p.employee.full_name} size="sm" />
                  <span className="text-sm font-medium text-df-text">{p.employee.full_name}</span>
                </div>
              </TableCell>
              {leaveTypes.map((t) => {
                const balance = balances.find(
                  (b) => b.employee_id === p.employee.id && b.leave_type_id === t.id
                )
                const allocated = balance?.allocated_days ?? 0
                const used = balance?.used_days ?? 0
                return (
                  <TableCell key={t.id} className="text-right tabular-nums">
                    {allocated < 0 ? `${used} used · Unlimited` : `${allocated - used} / ${allocated} days`}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
