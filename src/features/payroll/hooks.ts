import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getSalaryComponents, updateSalaryComponents } from "@/lib/mock/db"
import {
  createSalaryStructure as createSalaryStructureReal,
  getMySalary as getMySalaryReal,
} from "@/features/payroll/salary.service"
import { supabase } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/query-keys"
import type { SalaryComponentsDetail, SalaryStructure } from "@/types/domain"

/**
 * Every real call site uses this for the caller's own salary (the mock
 * employeeId param is never "someone else" in practice — the admin salary
 * builder path uses useSalaryComponents, not this hook — see note below),
 * so this maps to getMySalary(), ignoring the id.
 */
export function useSalaryStructure(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.salaryStructure(employeeId ?? ""),
    queryFn: async (): Promise<SalaryStructure | null> => {
      const { data, error } = await getMySalaryReal()
      if (error) throw new Error(error.message)
      return (data as unknown as SalaryStructure) ?? null
    },
    enabled: !!employeeId,
  })
}

/**
 * No dedicated "all salary structures" service function exists — this
 * queries salary_structures directly, relying on RLS (salary_select_own_or_admin)
 * to naturally return every row for an admin caller, which is the only role
 * that reaches the page using this hook (/salary is RoleRoute-gated to admin).
 * Sorted by effective_from desc so a consumer's `.find(s => s.employee_id === x)`
 * picks up each employee's most recent structure, matching the mock's
 * "current structure per employee" behavior without changing consumer code.
 */
export function useAllSalaryStructures() {
  return useQuery({
    queryKey: ["salary-structures", "all"],
    queryFn: async (): Promise<SalaryStructure[]> => {
      const { data, error } = await supabase
        .from("salary_structures")
        .select("*")
        .order("effective_from", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as SalaryStructure[]
    },
  })
}

/**
 * No real backing table for the detailed salary-components breakdown
 * (wage type, PF percentages, professional tax, per-component list) exists —
 * only basic_salary/allowances/deductions/net_salary on salary_structures.
 * Stays on mock data intentionally, same precedent as EmployeeProfileDetail
 * and leave balances elsewhere in this project.
 */
export function useSalaryComponents(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.salaryComponents(employeeId ?? ""),
    queryFn: () => getSalaryComponents(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useUpdateSalaryComponents(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      patch: Partial<
        Pick<
          SalaryComponentsDetail,
          | "month_wage"
          | "working_days_per_week"
          | "break_time_hours"
          | "pf_employee_percent"
          | "pf_employer_percent"
          | "professional_tax"
          | "components"
        >
      >
    ) => updateSalaryComponents(employeeId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.salaryComponents(employeeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.salaryStructure(employeeId) })
    },
  })
}

/**
 * Not part of the mock hook file originally (createSalaryStructure was
 * reached only via the mock's updateSalaryComponents path) — exported here
 * so a future admin salary-creation UI has a real hook to call. Unused by
 * any current consumer.
 */
export function useCreateSalaryStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Parameters<typeof createSalaryStructureReal>[0]) => {
      const { data, error } = await createSalaryStructureReal(input)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures", "all"] })
    },
  })
}
