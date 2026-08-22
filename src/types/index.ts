export type Role = 'employee' | 'admin';
export type EmploymentStatus = 'Active' | 'Inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveDecision = 'Approved' | 'Rejected';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  profile_id: string;
  employee_code: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  department: string | null;
  job_title: string | null;
  joining_date: string | null;
  employment_status: EmploymentStatus;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  total_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  created_at: string;
  updated_at: string;
}

export interface LeaveApproval {
  id: string;
  leave_request_id: string;
  approved_by: string;
  decision: LeaveDecision;
  comment: string | null;
  created_at: string;
}

export interface SalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  effective_from: string;
  created_at: string;
  updated_at: string;
}