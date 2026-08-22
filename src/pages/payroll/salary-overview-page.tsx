import * as React from "react"
import { SearchIcon, UsersIcon, WalletIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { AvatarInitials } from "@/components/common/avatar-initials"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
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
import { usePeople } from "@/features/employees/hooks"
import { useAllSalaryStructures } from "@/features/payroll/hooks"
import { formatCurrency } from "@/lib/format"
import { paths } from "@/routes/paths"

export default function SalaryOverviewPage() {
  const { data: people = [], isLoading: peopleLoading } = usePeople()
  const { data: structures = [], isLoading: structuresLoading } = useAllSalaryStructures()
  const [search, setSearch] = React.useState("")

  const totalPayroll = structures.reduce((sum, s) => sum + s.net_salary, 0)
  const avgSalary = structures.length ? totalPayroll / structures.length : 0

  const rows = people
    .map((p) => ({ person: p, structure: structures.find((s) => s.employee_id === p.employee.id) }))
    .filter(({ person }) => person.employee.full_name.toLowerCase().includes(search.toLowerCase()))

  const isLoading = peopleLoading || structuresLoading

  return (
    <div>
      <PageHeader title="Payroll" description="Salary visibility and management across the organization." />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Headcount" value={people.length} icon={<UsersIcon className="size-4" />} />
        <StatCard label="Total net payroll / month" value={formatCurrency(totalPayroll)} icon={<WalletIcon className="size-4" />} />
        <StatCard label="Average net pay" value={formatCurrency(avgSalary)} icon={<WalletIcon className="size-4" />} />
      </div>

      <div className="relative mb-4 w-full sm:w-72">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-df-text-subtle" />
        <Input
          placeholder="Search employee…"
          className="h-9 pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ person, structure }) => (
                <TableRow key={person.employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <AvatarInitials name={person.employee.full_name} size="sm" />
                      <span className="text-sm font-medium text-df-text">{person.employee.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{person.employee.department || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {structure ? formatCurrency(structure.basic_salary) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {structure ? formatCurrency(structure.deductions) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {structure ? formatCurrency(structure.net_salary) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" render={<Link to={paths.employee(person.employee.id)} />}>
                      Manage
                    </Button>
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
