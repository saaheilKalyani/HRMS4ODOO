/**
 * Domain types mirror the FROZEN contracts:
 *   - "Dayflow — API & Data Contracts v1.0.md" (§5 status enums, §6 entities, §27 naming)
 *   - "DB_SCHEMA_README.md" (table/column definitions)
 *
 * These are team-approved and frozen. Do not rename fields, change status
 * values, or add P0 entities without a team contract change (see §1 of the
 * API contract). Table-backed fields (profiles, employees, attendance_records,
 * leave_types, leave_requests, leave_approvals, salary_structures) must stay
 * in exact sync with those two documents.
 *
 * Fields under "UI extension" are needed by the approved DayflowBuildPrompt.md
 * visual design but are NOT part of the frozen contract. They're kept in
 * separate `*Detail` types so swapping in real Supabase data only requires
 * filling those in (or dropping the panels that use them), not touching the
 * core contract types.
 */

/** Contract §5 — frozen. Only two roles exist; there is no separate "hr" role. */
export type UserRole = "admin" | "employee"

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Contract §5 — frozen, exactly two values. */
export type EmploymentStatus = "Active" | "Inactive"

export interface Employee {
  id: string
  profile_id: string
  employee_code: string
  full_name: string
  phone: string | null
  address: string | null
  department: string | null
  job_title: string | null
  joining_date: string | null
  employment_status: EmploymentStatus
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

/** Contract §5 — frozen. */
export type AttendanceStatus = "Present" | "Absent" | "Half-day" | "Leave"

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

/** Contract §5 — frozen. */
export type LeaveStatus = "Pending" | "Approved" | "Rejected"

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

/** Contract §5 — frozen. */
export type LeaveDecision = "Approved" | "Rejected"

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
