/**
 * Domain types mirror the shared data contract in DAYFLOW_PROJECT_CONTEXT.md §10/§12.
 * Table-backed fields (profiles, employees, attendance_records, leave_types,
 * leave_requests, leave_approvals, salary_structures) must stay in sync with
 * whatever the DB owner ships — do not rename/remove them without team sign-off.
 *
 * Fields under "UI extension" are needed by the approved DayflowBuildPrompt.md
 * design but are not yet part of the approved DB contract. They're kept in
 * separate `*Detail` types so swapping in real Supabase data only requires
 * filling those in (or dropping the panels that use them), not touching the
 * core contract types.
 */

export type UserRole = "admin" | "hr" | "employee"

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type EmploymentStatus = "active" | "inactive" | "on_leave" | "terminated"

export interface Employee {
  id: string
  profile_id: string
  employee_code: string
  full_name: string
  phone: string
  address: string
  department: string
  job_title: string
  joining_date: string
  employment_status: EmploymentStatus
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave"

export interface AttendanceRecord {
  id: string
  employee_id: string
  attendance_date: string
  check_in: string | null
  check_out: string | null
  status: AttendanceStatus
  total_hours: number | null
  created_at: string
  updated_at: string
}

export interface LeaveType {
  id: string
  name: string
  description: string
  is_active: boolean
}

export type LeaveStatus = "pending" | "approved" | "rejected"

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  created_at: string
  updated_at: string
}

export type LeaveDecision = "approved" | "rejected"

export interface LeaveApproval {
  id: string
  leave_request_id: string
  approved_by: string
  decision: LeaveDecision
  comment: string
  created_at: string
}

export interface SalaryStructure {
  id: string
  employee_id: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  effective_from: string
  created_at: string
  updated_at: string
}

/* ---------------------------------------------------------------------- */
/* UI extensions — not yet part of the approved DB contract.               */
/* ---------------------------------------------------------------------- */

export interface EmployeeProfileDetail {
  employee_id: string
  manager_name: string | null
  company_name: string
  location: string
  about: string
  loves_about_job: string
  interests: string
  skills: string[]
  certifications: string[]
  date_of_birth: string | null
  personal_email: string
  gender: string | null
  marital_status: string | null
  nationality: string | null
  bank_account_number: string | null
  bank_name: string | null
  ifsc_code: string | null
  pan_no: string | null
  uan_no: string | null
}

export type ComputationType = "fixed" | "percentage"

export interface SalaryComponent {
  key: string
  label: string
  description: string
  computation: ComputationType
  /** percentage points, only meaningful when computation === "percentage" */
  percentageOf: "wage" | "basic"
  percentage: number
  /** resolved monthly rupee value, derived unless computation is fixed */
  value: number
  readOnly?: boolean
}

export interface SalaryComponentsDetail {
  employee_id: string
  wage_type: "fixed"
  month_wage: number
  working_days_per_week: number
  break_time_hours: number
  components: SalaryComponent[]
  pf_employee_percent: number
  pf_employer_percent: number
  professional_tax: number
}

export interface LeaveBalance {
  employee_id: string
  leave_type_id: string
  allocated_days: number
  used_days: number
}
