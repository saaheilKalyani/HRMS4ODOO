import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createEmployee,
  getPersonByEmployeeId,
  listPeople,
  updateEmployee,
  updateEmployeeDetail,
  updateEmploymentStatus,
  type NewEmployeeInput,
} from "@/lib/mock/db"
import { queryKeys } from "@/lib/query-keys"
import type { Employee, EmployeeProfileDetail, EmploymentStatus } from "@/types/domain"

export function usePeople() {
  return useQuery({ queryKey: queryKeys.people, queryFn: listPeople })
}

export function usePerson(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.person(employeeId ?? ""),
    queryFn: () => getPersonByEmployeeId(employeeId as string),
    enabled: !!employeeId,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
    },
  })
}

export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      patch: Partial<
        Pick<Employee, "phone" | "address" | "department" | "job_title" | "employment_status" | "full_name">
      >
    ) => updateEmployee(employeeId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}

export function useUpdateEmploymentStatus(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: EmploymentStatus) => updateEmploymentStatus(employeeId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}

export function useUpdateEmployeeDetail(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<EmployeeProfileDetail>) => updateEmployeeDetail(employeeId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}
