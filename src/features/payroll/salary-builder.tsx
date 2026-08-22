import * as React from "react"
import { AlertTriangleIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSalaryComponents, useUpdateSalaryComponents } from "@/features/payroll/hooks"
import { formatCurrency } from "@/lib/format"
import { computePayrollTotals, recalcSalaryComponents, round2 } from "@/lib/salary/calc"
import type { ComputationType, SalaryComponent } from "@/types/domain"

export function SalaryBuilder({ employeeId }: { employeeId: string }) {
  const { data: detail, isLoading } = useSalaryComponents(employeeId)
  const update = useUpdateSalaryComponents(employeeId)

  const [monthWage, setMonthWage] = React.useState(0)
  const [workingDays, setWorkingDays] = React.useState(5)
  const [breakHours, setBreakHours] = React.useState(1)
  const [components, setComponents] = React.useState<SalaryComponent[]>([])
  const [pfEmployee, setPfEmployee] = React.useState(12)
  const [pfEmployer, setPfEmployer] = React.useState(12)
  const [professionalTax, setProfessionalTax] = React.useState(200)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    if (!detail) return
    setMonthWage(detail.month_wage)
    setWorkingDays(detail.working_days_per_week)
    setBreakHours(detail.break_time_hours)
    setComponents(detail.components)
    setPfEmployee(detail.pf_employee_percent)
    setPfEmployer(detail.pf_employer_percent)
    setProfessionalTax(detail.professional_tax)
  }, [detail])

  const updateWage = (wage: number) => {
    setMonthWage(wage)
    setComponents((prev) => recalcSalaryComponents(wage, prev))
    setSaved(false)
  }

  const updateComponent = (key: string, patch: Partial<SalaryComponent>) => {
    setComponents((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, ...patch } : c))
      return recalcSalaryComponents(monthWage, next)
    })
    setSaved(false)
  }

  if (isLoading || !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  const totals = computePayrollTotals(monthWage, components, pfEmployee, pfEmployer, professionalTax)

  const handleSave = async () => {
    await update.mutateAsync({
      month_wage: monthWage,
      working_days_per_week: workingDays,
      break_time_hours: breakHours,
      components,
      pf_employee_percent: pfEmployee,
      pf_employer_percent: pfEmployer,
      professional_tax: professionalTax,
    })
    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Wage</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Wage type</Label>
            <Select value="fixed" disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed wage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Month wage (₹)</Label>
            <Input
              type="number"
              className="text-right tabular-nums"
              value={monthWage}
              onChange={(e) => updateWage(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Yearly wage (₹)</Label>
            <Input
              type="number"
              className="text-right tabular-nums"
              value={round2(monthWage * 12)}
              onChange={(e) => updateWage(round2((Number(e.target.value) || 0) / 12))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Days / week</Label>
              <Input
                type="number"
                className="text-right tabular-nums"
                value={workingDays}
                onChange={(e) => {
                  setWorkingDays(Number(e.target.value) || 0)
                  setSaved(false)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Break (hrs)</Label>
              <Input
                type="number"
                className="text-right tabular-nums"
                value={breakHours}
                onChange={(e) => {
                  setBreakHours(Number(e.target.value) || 0)
                  setSaved(false)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salary components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="hidden grid-cols-[1.6fr_1fr_0.7fr_1fr] gap-3 px-2 pb-2 sm:grid">
            <span className="text-label text-df-text-subtle">Component</span>
            <span className="text-label text-df-text-subtle">Computation</span>
            <span className="text-label text-right text-df-text-subtle">%</span>
            <span className="text-label text-right text-df-text-subtle">Value (₹/month)</span>
          </div>
          {components.map((c) => (
            <div
              key={c.key}
              className="grid grid-cols-1 gap-2 rounded-lg px-2 py-2.5 sm:grid-cols-[1.6fr_1fr_0.7fr_1fr] sm:items-center sm:gap-3 odd:bg-df-surface-alt"
            >
              <div>
                <p className="text-sm font-medium text-df-text">{c.label}</p>
                <p className="text-xs text-df-text-subtle">{c.description}</p>
              </div>
              <Select
                value={c.computation}
                disabled={c.readOnly}
                onValueChange={(v) => updateComponent(c.key, { computation: v as ComputationType })}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">
                    Percentage of {c.percentageOf === "basic" ? "Basic" : "Wage"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                disabled={c.readOnly || c.computation !== "percentage"}
                className="text-right tabular-nums"
                value={c.computation === "percentage" ? c.percentage : ""}
                onChange={(e) => updateComponent(c.key, { percentage: Number(e.target.value) || 0 })}
              />
              <Input
                type="number"
                disabled={c.readOnly || c.computation !== "fixed"}
                className="text-right font-medium tabular-nums"
                value={c.value}
                onChange={(e) => updateComponent(c.key, { value: Number(e.target.value) || 0 })}
              />
            </div>
          ))}

          {totals.isOverBudget && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-df-danger-soft px-3 py-2 text-sm text-df-danger">
              <AlertTriangleIcon className="size-4 shrink-0" />
              Components exceed the defined wage. Reduce another component so Fixed Allowance isn't negative.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provident Fund (PF) contribution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employee %</Label>
              <Input
                type="number"
                className="text-right tabular-nums"
                value={pfEmployee}
                onChange={(e) => {
                  setPfEmployee(Number(e.target.value) || 0)
                  setSaved(false)
                }}
              />
              <p className="text-xs text-df-text-subtle tabular-nums">{formatCurrency(totals.pfEmployee)}/mo</p>
            </div>
            <div className="space-y-1.5">
              <Label>Employer %</Label>
              <Input
                type="number"
                className="text-right tabular-nums"
                value={pfEmployer}
                onChange={(e) => {
                  setPfEmployer(Number(e.target.value) || 0)
                  setSaved(false)
                }}
              />
              <p className="text-xs text-df-text-subtle tabular-nums">{formatCurrency(totals.pfEmployer)}/mo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <Label>Professional tax (₹/month)</Label>
            <Input
              type="number"
              className="w-40 text-right tabular-nums"
              value={professionalTax}
              onChange={(e) => {
                setProfessionalTax(Number(e.target.value) || 0)
                setSaved(false)
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-df-surface-alt">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-label text-df-text-subtle">Net pay</p>
            <p className="text-stat text-df-text tabular-nums">{formatCurrency(totals.netPay)}</p>
            <p className="text-xs text-df-text-subtle">
              Gross {formatCurrency(totals.grossWage)} − PF {formatCurrency(totals.pfEmployee)} − Tax{" "}
              {formatCurrency(totals.professionalTax)}
            </p>
          </div>
          <Button onClick={handleSave} disabled={update.isPending || totals.isOverBudget}>
            <SaveIcon data-icon="inline-start" />
            {update.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
