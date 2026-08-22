import type { SalaryComponent } from "@/types/domain"

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Resolves every component's rupee value from the current month wage.
 * Basic = % of wage. HRA = % of Basic (not wage). Fixed Allowance is always
 * the remainder (wage - sum of everything else) and is read-only.
 * DayflowBuildPrompt.md §7.6.
 */
export function recalcSalaryComponents(
  monthWage: number,
  components: SalaryComponent[]
): SalaryComponent[] {
  const basicDef = components.find((c) => c.key === "basic")
  const basicValue =
    basicDef && basicDef.computation === "percentage"
      ? round2((monthWage * basicDef.percentage) / 100)
      : (basicDef?.value ?? 0)

  let sumExcludingRemainder = 0
  const resolved = components.map((c) => {
    if (c.key === "fixed_allowance") return c
    let value: number
    if (c.computation === "percentage") {
      const base = c.percentageOf === "basic" ? basicValue : monthWage
      value = round2((base * c.percentage) / 100)
    } else {
      value = c.value
    }
    sumExcludingRemainder += value
    return { ...c, value }
  })

  return resolved.map((c) =>
    c.key === "fixed_allowance"
      ? { ...c, value: round2(monthWage - sumExcludingRemainder) }
      : c
  )
}

export function defaultSalaryComponents(monthWage: number, performanceBonus = 0): SalaryComponent[] {
  const seed: SalaryComponent[] = [
    {
      key: "basic",
      label: "Basic Salary",
      description: "Core pay component, 50% of monthly wage",
      computation: "percentage",
      percentageOf: "wage",
      percentage: 50,
      value: 0,
    },
    {
      key: "hra",
      label: "House Rent Allowance",
      description: "50% of Basic Salary",
      computation: "percentage",
      percentageOf: "basic",
      percentage: 50,
      value: 0,
    },
    {
      key: "standard_allowance",
      label: "Standard Allowance",
      description: "Flat allowance, 10% of monthly wage",
      computation: "percentage",
      percentageOf: "wage",
      percentage: 10,
      value: 0,
    },
    {
      key: "performance_bonus",
      label: "Performance Bonus",
      description: "Discretionary, fixed amount per month",
      computation: "fixed",
      percentageOf: "wage",
      percentage: 0,
      value: performanceBonus,
    },
    {
      key: "lta",
      label: "Leave Travel Allowance",
      description: "8.33% of monthly wage",
      computation: "percentage",
      percentageOf: "wage",
      percentage: 8.33,
      value: 0,
    },
    {
      key: "fixed_allowance",
      label: "Fixed Allowance",
      description: "Remainder of wage after all other components",
      computation: "fixed",
      percentageOf: "wage",
      percentage: 0,
      value: 0,
      readOnly: true,
    },
  ]
  return recalcSalaryComponents(monthWage, seed)
}

export function componentsTotal(components: SalaryComponent[]): number {
  return round2(components.reduce((sum, c) => sum + c.value, 0))
}

export function basicValueOf(components: SalaryComponent[]): number {
  return components.find((c) => c.key === "basic")?.value ?? 0
}

export interface PayrollTotals {
  grossWage: number
  basic: number
  pfEmployee: number
  pfEmployer: number
  professionalTax: number
  netPay: number
  isOverBudget: boolean
}

export function computePayrollTotals(
  monthWage: number,
  components: SalaryComponent[],
  pfEmployeePercent: number,
  pfEmployerPercent: number,
  professionalTax: number
): PayrollTotals {
  const basic = basicValueOf(components)
  const pfEmployee = round2((basic * pfEmployeePercent) / 100)
  const pfEmployer = round2((basic * pfEmployerPercent) / 100)
  const fixedAllowance = components.find((c) => c.key === "fixed_allowance")?.value ?? 0
  return {
    grossWage: monthWage,
    basic,
    pfEmployee,
    pfEmployer,
    professionalTax,
    netPay: round2(monthWage - pfEmployee - professionalTax),
    isOverBudget: fixedAllowance < 0,
  }
}
