import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSalaryComponents, useSalaryStructure } from "@/features/payroll/hooks"
import { formatCurrency } from "@/lib/format"
import { computePayrollTotals } from "@/lib/salary/calc"

export function MySalaryTab({ employeeId }: { employeeId: string }) {
  const { data: detail, isLoading } = useSalaryComponents(employeeId)
  const { data: structure } = useSalaryStructure(employeeId)

  if (isLoading || !detail || !structure) {
    return <Skeleton className="h-72 w-full" />
  }

  const totals = computePayrollTotals(
    detail.month_wage,
    detail.components,
    detail.pf_employee_percent,
    detail.pf_employer_percent,
    detail.professional_tax
  )

  return (
    <div className="space-y-5">
      <Card className="bg-df-surface-alt">
        <CardContent>
          <p className="text-label text-df-text-subtle">Net pay this month</p>
          <p className="text-stat text-df-text tabular-nums">{formatCurrency(totals.netPay)}</p>
          <p className="mt-1 text-xs text-df-text-subtle">
            Effective from {new Date(structure.effective_from).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {detail.components.map((c) => (
            <div key={c.key} className="flex items-center justify-between rounded-lg px-2 py-2 odd:bg-df-surface-alt">
              <div>
                <p className="text-sm text-df-text">{c.label}</p>
                <p className="text-xs text-df-text-subtle">{c.description}</p>
              </div>
              <span className="text-sm font-medium text-df-text tabular-nums">{formatCurrency(c.value)}</span>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-3">
            <span className="text-sm font-medium text-df-text">Gross wage</span>
            <span className="text-sm font-semibold text-df-text tabular-nums">{formatCurrency(totals.grossWage)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between rounded-lg px-2 py-2 odd:bg-df-surface-alt">
            <span className="text-sm text-df-text">Provident Fund ({detail.pf_employee_percent}% of Basic)</span>
            <span className="text-sm font-medium text-df-text tabular-nums">{formatCurrency(totals.pfEmployee)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-2 odd:bg-df-surface-alt">
            <span className="text-sm text-df-text">Professional Tax</span>
            <span className="text-sm font-medium text-df-text tabular-nums">{formatCurrency(totals.professionalTax)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
