import { addDays, format, isWeekend } from "date-fns"

import { generateLoginId, generateTempPassword } from "@/lib/auth/generate-login-id"
import { people as seedPeople } from "@/lib/mock/people"
import { buildSeed, leaveTypes as seedLeaveTypes } from "@/lib/mock/seed"
import { defaultSalaryComponents, recalcSalaryComponents } from "@/lib/salary/calc"
import type {
  AttendanceRecord,
  Employee,
  EmployeeProfileDetail,
  EmploymentStatus,
  LeaveApproval,
  LeaveBalance,
  LeaveDecision,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Profile,
  SalaryComponentsDetail,
  SalaryStructure,
  UserRole,
} from "@/types/domain"

const STORAGE_KEY = "dayflow:db:v1"
const dateStr = (d: Date) => format(d, "yyyy-MM-dd")

export interface Person {
  profile: Profile
  employee: Employee
  detail: EmployeeProfileDetail
  password: string
}

interface DbState {
  version: number
  people: Person[]
  attendanceRecords: AttendanceRecord[]
  leaveTypes: LeaveType[]
  leaveRequests: LeaveRequest[]
  leaveApprovals: LeaveApproval[]
  leaveBalances: LeaveBalance[]
  salaryStructures: SalaryStructure[]
  salaryComponentsDetails: SalaryComponentsDetail[]
  nextSerial: number
}

function freshState(): DbState {
  const seed = buildSeed(new Date())
  return {
    version: 1,
    people: seedPeople.map((p) => ({ ...p })),
    attendanceRecords: seed.attendanceRecords,
    leaveTypes: seedLeaveTypes,
    leaveRequests: seed.leaveRequests,
    leaveApprovals: seed.leaveApprovals,
    leaveBalances: seed.leaveBalances,
    salaryStructures: seed.salaryStructures,
    salaryComponentsDetails: seed.salaryComponentsDetails,
    nextSerial: seedPeople.length + 1,
  }
}

function load(): DbState {
  if (typeof window === "undefined") return freshState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const state = freshState()
      save(state)
      return state
    }
    const parsed = JSON.parse(raw) as DbState
    if (parsed.version !== 1) {
      const state = freshState()
      save(state)
      return state
    }
    return parsed
  } catch {
    const state = freshState()
    save(state)
    return state
  }
}

function save(state: DbState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let state = load()

export function resetDemoData() {
  state = freshState()
  save(state)
  if (typeof window !== "undefined") window.location.reload()
}

const delay = (ms = 250 + Math.random() * 200) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------- People -------------------------------- */

export async function listPeople(): Promise<Person[]> {
  await delay()
  return [...state.people]
}

export async function getPersonByEmployeeId(employeeId: string): Promise<Person | null> {
  await delay(150)
  return state.people.find((p) => p.employee.id === employeeId) ?? null
}

export async function findPersonByLoginId(loginId: string): Promise<Person | undefined> {
  await delay(400)
  return state.people.find(
    (p) => p.employee.employee_code.toLowerCase() === loginId.trim().toLowerCase()
  )
}

export interface NewEmployeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  jobTitle: string
  joiningDate: string
  role: UserRole
}

export interface NewEmployeeResult {
  person: Person
  loginId: string
  tempPassword: string
}

export async function createEmployee(input: NewEmployeeInput): Promise<NewEmployeeResult> {
  await delay(350)
  const serial = state.nextSerial
  const loginId = generateLoginId(input.firstName, input.lastName, input.joiningDate, serial)
  const tempPassword = generateTempPassword()
  const id = `emp-${crypto.randomUUID().slice(0, 8)}`
  const profileId = `profile-${crypto.randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()

  const profile: Profile = {
    id: profileId,
    email: input.email,
    role: input.role,
    display_name: `${input.firstName} ${input.lastName}`,
    is_active: true,
    created_at: now,
    updated_at: now,
  }

  const employee: Employee = {
    id,
    profile_id: profileId,
    employee_code: loginId,
    full_name: `${input.firstName} ${input.lastName}`,
    phone: input.phone,
    address: "",
    department: input.department,
    job_title: input.jobTitle,
    joining_date: input.joiningDate,
    employment_status: "active",
    profile_picture_url: null,
    created_at: now,
    updated_at: now,
  }

  const detail: EmployeeProfileDetail = {
    employee_id: id,
    manager_name: null,
    company_name: "Dayflow Technologies",
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

  const person: Person = { profile, employee, detail, password: tempPassword }
  state.people.push(person)
  state.nextSerial += 1

  const monthWage = 50000
  const components = defaultSalaryComponents(monthWage)
  const salaryDetail: SalaryComponentsDetail = {
    employee_id: id,
    wage_type: "fixed",
    month_wage: monthWage,
    working_days_per_week: 5,
    break_time_hours: 1,
    components,
    pf_employee_percent: 12,
    pf_employer_percent: 12,
    professional_tax: 200,
  }
  state.salaryComponentsDetails.push(salaryDetail)

  const basic = components.find((c) => c.key === "basic")?.value ?? 0
  const allowances = components.filter((c) => c.key !== "basic").reduce((s, c) => s + c.value, 0)
  const pf = Math.round(((basic * 12) / 100) * 100) / 100
  state.salaryStructures.push({
    id: `sal-${id}`,
    employee_id: id,
    basic_salary: basic,
    allowances: Math.round(allowances * 100) / 100,
    deductions: Math.round((pf + 200) * 100) / 100,
    net_salary: Math.round((monthWage - pf - 200) * 100) / 100,
    effective_from: input.joiningDate,
    created_at: now,
    updated_at: now,
  })

  for (const type of state.leaveTypes) {
    state.leaveBalances.push({
      employee_id: id,
      leave_type_id: type.id,
      allocated_days: type.id === "lt-unpaid" ? -1 : type.id === "lt-sick" ? 7 : type.id === "lt-casual" ? 12 : 24,
      used_days: 0,
    })
  }

  save(state)
  return { person, loginId, tempPassword }
}

export async function updateEmployee(
  employeeId: string,
  patch: Partial<Pick<Employee, "phone" | "address" | "department" | "job_title" | "employment_status" | "full_name">>
): Promise<Employee> {
  await delay(300)
  const person = state.people.find((p) => p.employee.id === employeeId)
  if (!person) throw new Error("Employee not found")
  person.employee = { ...person.employee, ...patch, updated_at: new Date().toISOString() }
  save(state)
  return person.employee
}

export async function updateEmploymentStatus(
  employeeId: string,
  status: EmploymentStatus
): Promise<Employee> {
  return updateEmployee(employeeId, { employment_status: status })
}

export async function changePassword(
  employeeId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await delay(300)
  const person = state.people.find((p) => p.employee.id === employeeId)
  if (!person) throw new Error("Employee not found")
  if (person.password !== currentPassword) throw new Error("Current password is incorrect.")
  person.password = newPassword
  save(state)
}

export async function updateEmployeeDetail(
  employeeId: string,
  patch: Partial<EmployeeProfileDetail>
): Promise<EmployeeProfileDetail> {
  await delay(300)
  const person = state.people.find((p) => p.employee.id === employeeId)
  if (!person) throw new Error("Employee not found")
  person.detail = { ...person.detail, ...patch }
  save(state)
  return person.detail
}

/* ----------------------------- Attendance -------------------------------- */

export interface AttendanceFilter {
  employeeId?: string
  from?: string
  to?: string
}

export async function listAttendance(filter: AttendanceFilter = {}): Promise<AttendanceRecord[]> {
  await delay()
  return state.attendanceRecords
    .filter((r) => (filter.employeeId ? r.employee_id === filter.employeeId : true))
    .filter((r) => (filter.from ? r.attendance_date >= filter.from : true))
    .filter((r) => (filter.to ? r.attendance_date <= filter.to : true))
    .sort((a, b) => (a.attendance_date < b.attendance_date ? 1 : -1))
}

export async function getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  await delay(120)
  const today = dateStr(new Date())
  return (
    state.attendanceRecords.find(
      (r) => r.employee_id === employeeId && r.attendance_date === today
    ) ?? null
  )
}

export async function checkIn(employeeId: string): Promise<AttendanceRecord> {
  await delay(300)
  const today = dateStr(new Date())
  const now = new Date().toISOString()
  let record = state.attendanceRecords.find(
    (r) => r.employee_id === employeeId && r.attendance_date === today
  )
  if (record && record.check_in) {
    throw new Error("Already checked in today")
  }
  if (record) {
    record.check_in = now
    record.status = "present"
    record.updated_at = now
  } else {
    record = {
      id: `att-${employeeId}-${today}`,
      employee_id: employeeId,
      attendance_date: today,
      check_in: now,
      check_out: null,
      status: "present",
      total_hours: null,
      created_at: now,
      updated_at: now,
    }
    state.attendanceRecords.push(record)
  }
  save(state)
  return record
}

export async function checkOut(employeeId: string): Promise<AttendanceRecord> {
  await delay(300)
  const today = dateStr(new Date())
  const now = new Date()
  const record = state.attendanceRecords.find(
    (r) => r.employee_id === employeeId && r.attendance_date === today
  )
  if (!record || !record.check_in) throw new Error("Check in first")
  if (record.check_out) throw new Error("Already checked out today")
  record.check_out = now.toISOString()
  const hours = (now.getTime() - new Date(record.check_in).getTime()) / (1000 * 60 * 60)
  record.total_hours = Math.round(hours * 100) / 100
  record.status = hours < 5 ? "half_day" : "present"
  record.updated_at = now.toISOString()
  save(state)
  return record
}

/* ------------------------------- Leave ----------------------------------- */

export async function listLeaveTypes(): Promise<LeaveType[]> {
  await delay(100)
  return [...state.leaveTypes]
}

export interface LeaveRequestFilter {
  employeeId?: string
  status?: LeaveStatus
}

export async function listLeaveRequests(filter: LeaveRequestFilter = {}): Promise<LeaveRequest[]> {
  await delay()
  return state.leaveRequests
    .filter((r) => (filter.employeeId ? r.employee_id === filter.employeeId : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function listLeaveApprovals(): Promise<LeaveApproval[]> {
  await delay(100)
  return [...state.leaveApprovals]
}

export interface NewLeaveRequestInput {
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
}

export async function createLeaveRequest(input: NewLeaveRequestInput): Promise<LeaveRequest> {
  await delay(350)
  const now = new Date().toISOString()
  const request: LeaveRequest = {
    id: `lr-${crypto.randomUUID().slice(0, 8)}`,
    employee_id: input.employeeId,
    leave_type_id: input.leaveTypeId,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: input.reason,
    status: "pending",
    created_at: now,
    updated_at: now,
  }
  state.leaveRequests.push(request)
  save(state)
  return request
}

function markAttendanceAsLeave(employeeId: string, startDate: string, endDate: string) {
  let day = new Date(startDate)
  const end = new Date(endDate)
  while (day <= end) {
    if (!isWeekend(day)) {
      const ds = dateStr(day)
      const existing = state.attendanceRecords.find(
        (r) => r.employee_id === employeeId && r.attendance_date === ds
      )
      if (existing) {
        existing.check_in = null
        existing.check_out = null
        existing.status = "leave"
        existing.total_hours = null
        existing.updated_at = new Date().toISOString()
      } else {
        state.attendanceRecords.push({
          id: `att-${employeeId}-${ds}`,
          employee_id: employeeId,
          attendance_date: ds,
          check_in: null,
          check_out: null,
          status: "leave",
          total_hours: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }
    day = addDays(day, 1)
  }
}

export interface DecideLeaveInput {
  requestId: string
  decision: LeaveDecision
  comment: string
  approverId: string
}

export async function decideLeaveRequest(input: DecideLeaveInput): Promise<LeaveRequest> {
  await delay(350)
  const request = state.leaveRequests.find((r) => r.id === input.requestId)
  if (!request) throw new Error("Leave request not found")
  request.status = input.decision
  request.updated_at = new Date().toISOString()

  state.leaveApprovals.push({
    id: `la-${request.id}-${Date.now()}`,
    leave_request_id: request.id,
    approved_by: input.approverId,
    decision: input.decision,
    comment: input.comment,
    created_at: new Date().toISOString(),
  })

  if (input.decision === "approved") {
    markAttendanceAsLeave(request.employee_id, request.start_date, request.end_date)
    const balance = state.leaveBalances.find(
      (b) => b.employee_id === request.employee_id && b.leave_type_id === request.leave_type_id
    )
    if (balance) {
      const days =
        (new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) /
          (1000 * 60 * 60 * 24) +
        1
      balance.used_days += days
    }
  }

  save(state)
  return request
}

export async function listLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  await delay(150)
  return state.leaveBalances.filter((b) => b.employee_id === employeeId)
}

export async function listAllLeaveBalances(): Promise<LeaveBalance[]> {
  await delay(150)
  return [...state.leaveBalances]
}

/* ------------------------------- Salary ----------------------------------- */

export async function getSalaryComponents(employeeId: string): Promise<SalaryComponentsDetail | null> {
  await delay(200)
  return state.salaryComponentsDetails.find((s) => s.employee_id === employeeId) ?? null
}

export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  await delay(150)
  return state.salaryStructures.find((s) => s.employee_id === employeeId) ?? null
}

export async function listAllSalaryStructures(): Promise<SalaryStructure[]> {
  await delay(200)
  return [...state.salaryStructures]
}

export async function updateSalaryComponents(
  employeeId: string,
  patch: Partial<Pick<SalaryComponentsDetail, "month_wage" | "working_days_per_week" | "break_time_hours" | "pf_employee_percent" | "pf_employer_percent" | "professional_tax" | "components">>
): Promise<SalaryComponentsDetail> {
  await delay(350)
  const existing = state.salaryComponentsDetails.find((s) => s.employee_id === employeeId)
  if (!existing) throw new Error("Salary record not found")

  const monthWage = patch.month_wage ?? existing.month_wage
  const components = recalcSalaryComponents(monthWage, patch.components ?? existing.components)

  const updated: SalaryComponentsDetail = {
    ...existing,
    ...patch,
    month_wage: monthWage,
    components,
  }
  state.salaryComponentsDetails = state.salaryComponentsDetails.map((s) =>
    s.employee_id === employeeId ? updated : s
  )

  const basic = components.find((c) => c.key === "basic")?.value ?? 0
  const allowances = components.filter((c) => c.key !== "basic").reduce((s, c) => s + c.value, 0)
  const pf = Math.round(((basic * updated.pf_employee_percent) / 100) * 100) / 100
  const structure = state.salaryStructures.find((s) => s.employee_id === employeeId)
  if (structure) {
    structure.basic_salary = basic
    structure.allowances = Math.round(allowances * 100) / 100
    structure.deductions = Math.round((pf + updated.professional_tax) * 100) / 100
    structure.net_salary = Math.round((monthWage - pf - updated.professional_tax) * 100) / 100
    structure.updated_at = new Date().toISOString()
  }

  save(state)
  return updated
}
