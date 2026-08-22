import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  getSalaryComponents,
  getSalaryStructure,
  listAllSalaryStructures,
  updateSalaryComponents,
} from "@/lib/mock/db"
import { queryKeys } from "@/lib/query-keys"
import type { SalaryComponentsDetail } from "@/types/domain"

export function useSalaryComponents(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.salaryComponents(employeeId ?? ""),
    queryFn: () => getSalaryComponents(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useSalaryStructure(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.salaryStructure(employeeId ?? ""),
    queryFn: () => getSalaryStructure(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useAllSalaryStructures() {
  return useQuery({ queryKey: ["salary-structures", "all"], queryFn: listAllSalaryStructures })
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
