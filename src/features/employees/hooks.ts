import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createEmployee as createEmployeeReal,
  getEmployee as getEmployeeReal,
  getEmployees as getEmployeesReal,
  updateEmployee as updateEmployeeReal,
  type CreateEmployeeInput,
} from "@/features/employees/employee.service"
import { supabase } from "@/lib/supabase/client"
import { queryKeys } from "@/lib/query-keys"
import type { Employee, EmployeeProfileDetail, EmploymentStatus, Profile } from "@/types/domain"

/**
 * Person mirrors the mock layer's shape so existing consumers (usePeople,
 * usePerson callers) don't need widespread changes. `detail` has no backing
 * table in the live schema (Phase 6/7's frozen contract never added one) —
 * it's always returned empty here, not fabricated. `password` is dropped
 * entirely: it was only ever a mock-auth artifact and has no real analog.
 */
export interface Person {
  profile: Profile
  employee: Employee
  detail: EmployeeProfileDetail
}

function emptyDetail(employeeId: string): EmployeeProfileDetail {
  return {
    employee_id: employeeId,
    manager_name: null,
    company_name: "",
    location: "",
    about: "",
    loves_about_job: "",
    interests: "",
    skills: [],
    certifications: [],
    date_of_birth: null,
    personal_email: "",
    gender: null,
    marital_status: null,
    nationality: null,
    bank_account_number: null,
    bank_name: null,
    ifsc_code: null,
    pan_no: null,
    uan_no: null,
  }
}

async function fetchProfilesByIds(profileIds: string[]): Promise<Map<string, Profile>> {
  if (profileIds.length === 0) return new Map()
  const { data, error } = await supabase.from("profiles").select("*").in("id", profileIds)
  if (error) throw error
  const map = new Map<string, Profile>()
  for (const p of (data ?? []) as Profile[]) map.set(p.id, p)
  return map
}

async function listPeopleReal(): Promise<Person[]> {
  const { data, error } = await getEmployeesReal()
  if (error) throw new Error(error.message)
  const employees = (data ?? []) as unknown as Employee[]
  const profileMap = await fetchProfilesByIds(employees.map((e) => e.profile_id))
  return employees.map((employee) => ({
    employee,
    profile: profileMap.get(employee.profile_id) as Profile,
    detail: emptyDetail(employee.id),
  }))
}

async function getPersonReal(employeeId: string): Promise<Person | null> {
  const { data, error } = await getEmployeeReal(employeeId)
  if (error) throw new Error(error.message)
  if (!data) return null
  const employee = data as unknown as Employee
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", employee.profile_id)
    .single()
  if (profileError) throw profileError
  return {
    employee,
    profile: profile as Profile,
    detail: emptyDetail(employee.id),
  }
}

export function usePeople() {
  return useQuery({ queryKey: queryKeys.people, queryFn: listPeopleReal })
}

export function usePerson(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.person(employeeId ?? ""),
    queryFn: () => getPersonReal(employeeId as string),
    enabled: !!employeeId,
  })
}

/**
 * Mock's NewEmployeeInput used firstName/lastName/role — the real RPC
 * (create_employee_with_auth) takes a single full_name and never accepts a
 * role (it always creates 'employee', by design — role is never
 * client-suppliable anywhere in this project). The role field is accepted
 * here for source compatibility with existing callers but is intentionally
 * ignored; callers should stop passing it.
 */
export interface NewEmployeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  jobTitle: string
  joiningDate: string
  role?: string
}

export interface NewEmployeeResult {
  person: Person
  /** The email the new employee signs in with (mock's "Login ID" concept has no real equivalent). */
  loginId: string
  /**
   * The RPC currently sets a fixed placeholder password for every new
   * employee (see supabase/migrations/20260822060409_create_employee_rpc.sql)
   * rather than generating one — this is a known, pre-existing limitation
   * of the RPC itself, not something invented here.
   */
  tempPassword: string
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewEmployeeInput): Promise<NewEmployeeResult> => {
      const payload: CreateEmployeeInput = {
        email: input.email,
        full_name: `${input.firstName} ${input.lastName}`.trim(),
        phone: input.phone || undefined,
        department: input.department || undefined,
        job_title: input.jobTitle || undefined,
        joining_date: input.joiningDate || undefined,
      }
      const { data, error } = await createEmployeeReal(payload)
      if (error) throw new Error(error.message)
      const employee = data as unknown as Employee
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", employee.profile_id)
        .single()
      if (profileError) throw profileError
      return {
        person: { employee, profile: profile as Profile, detail: emptyDetail(employee.id) },
        loginId: input.email,
        tempPassword: "temporaryPassword123",
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
    },
  })
}

export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<Employee, "phone" | "address" | "department" | "job_title" | "employment_status" | "full_name">
      >
    ) => {
      const { data, error } = await updateEmployeeReal(employeeId, {
        phone: patch.phone ?? undefined,
        address: patch.address ?? undefined,
        department: patch.department ?? undefined,
        job_title: patch.job_title ?? undefined,
        employment_status: patch.employment_status,
        full_name: patch.full_name,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}

export function useUpdateEmploymentStatus(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (status: EmploymentStatus) => {
      const { data, error } = await updateEmployeeReal(employeeId, { employment_status: status })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.people })
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}

/**
 * No real backing table for EmployeeProfileDetail exists (see Person.detail
 * above). This mutation is kept for source compatibility with existing
 * consumers but is a no-op against the real backend — it does not persist
 * anything. Flagged clearly rather than silently pretending to save.
 */
export function useUpdateEmployeeDetail(employeeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_patch: Partial<EmployeeProfileDetail>) => {
      console.warn(
        "useUpdateEmployeeDetail: no live backend column for this data — change was not persisted."
      )
      return emptyDetail(employeeId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.person(employeeId) })
    },
  })
}
