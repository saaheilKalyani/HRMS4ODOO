import { supabase } from '../../lib/supabase/client';
import type { Employee, AttendanceRecord, SalaryStructure } from '../../types';

export type ApiErrorCode =
  | 'AUTH_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'OPERATION_FAILED';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: ApiError | null;
}

const mapSupabaseError = (error: any): ApiError => {
  const message = error?.message || 'An unexpected error occurred.';

  if (message.toLowerCase().includes('jwt expired') || message.toLowerCase().includes('unauthorized')) {
    return { code: 'UNAUTHORIZED', message: 'Authentication is required.' };
  }

  if (message.toLowerCase().includes('row-level security')) {
    return { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' };
  }

  return { code: 'DATABASE_ERROR', message };
};

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

async function getEmployeeIdByProfileId(profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function isAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin' && profile?.is_active === true;
}

export interface EmployeeDashboardData {
  employee: Employee;
  todayAttendance: AttendanceRecord | null;
  recentAttendance: AttendanceRecord[];
  leaveSummary: {
    pending: number;
    approved: number;
    rejected: number;
  };
  salarySummary: SalaryStructure | null;
}

export async function getEmployeeDashboard(): Promise<ServiceResult<EmployeeDashboardData>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    };
  }

  try {
    const employeeId = await getEmployeeIdByProfileId(userId);
    if (!employeeId) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Employee record not found.' },
      };
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;

    const today = new Date().toISOString().split('T')[0];

    const { data: todayAttendance, error: attError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (attError) throw attError;

    const { data: recentAttendance, error: recentError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('attendance_date', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const { data: pendingLeaves, error: pendingError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('employee_id', employeeId)
      .eq('status', 'Pending');

    if (pendingError) throw pendingError;

    const { data: approvedLeaves, error: approvedError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('employee_id', employeeId)
      .eq('status', 'Approved');

    if (approvedError) throw approvedError;

    const { data: rejectedLeaves, error: rejectedError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('employee_id', employeeId)
      .eq('status', 'Rejected');

    if (rejectedError) throw rejectedError;

    const { data: salary, error: salaryError } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('effective_from', today)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (salaryError) throw salaryError;

    return {
      data: {
        employee: employee as Employee,
        todayAttendance: (todayAttendance as AttendanceRecord) ?? null,
        recentAttendance: (recentAttendance as AttendanceRecord[]) ?? [],
        leaveSummary: {
          pending: pendingLeaves?.length ?? 0,
          approved: approvedLeaves?.length ?? 0,
          rejected: rejectedLeaves?.length ?? 0,
        },
        salarySummary: (salary as SalaryStructure) ?? null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface AdminDashboardData {
  totalEmployees: number;
  presentEmployees: number;
  absentEmployees: number;
  leaveEmployees: number;
  pendingLeaveRequests: number;
  recentAttendance: AttendanceRecord[];
}

export async function getAdminDashboard(): Promise<ServiceResult<AdminDashboardData>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const { count: totalEmployees, error: totalError } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('employment_status', 'Active');

    if (totalError) throw totalError;

    const { count: presentEmployees, error: presentError } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .eq('attendance_date', today)
      .eq('status', 'Present');

    if (presentError) throw presentError;

    const { count: absentEmployees, error: absentError } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .eq('attendance_date', today)
      .eq('status', 'Absent');

    if (absentError) throw absentError;

    const { count: leaveEmployees, error: leaveError } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact' })
      .eq('attendance_date', today)
      .eq('status', 'Leave');

    if (leaveError) throw leaveError;

    const { count: pendingLeaveRequests, error: pendingReqError } = await supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('status', 'Pending');

    if (pendingReqError) throw pendingReqError;

    const { data: recentAttendance, error: recentError } = await supabase
      .from('attendance_records')
      .select('*')
      .order('attendance_date', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    return {
      data: {
        totalEmployees: totalEmployees ?? 0,
        presentEmployees: presentEmployees ?? 0,
        absentEmployees: absentEmployees ?? 0,
        leaveEmployees: leaveEmployees ?? 0,
        pendingLeaveRequests: pendingLeaveRequests ?? 0,
        recentAttendance: (recentAttendance as AttendanceRecord[]) ?? [],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}