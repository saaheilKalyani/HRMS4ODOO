import { supabase } from '@/lib/supabase/client';
import type { LeaveRequest, LeaveType, LeaveApproval, Employee } from '@/types';

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

  if (
    message.toLowerCase().includes('jwt expired') ||
    message.toLowerCase().includes('unauthorized')
  ) {
    return { code: 'UNAUTHORIZED', message: 'Authentication is required.' };
  }

  if (message.toLowerCase().includes('row-level security')) {
    return { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' };
  }

  if (message.toLowerCase().includes('not found')) {
    return { code: 'NOT_FOUND', message: 'Requested record was not found.' };
  }

  return { code: 'DATABASE_ERROR', message };
};

// ---------- Helpers ----------

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

/**
 * createLeaveRequest()
 * Employee creates a leave request.
 * Only accepts: leave_type_id, start_date, end_date, reason
 * Default status: Pending
 */
export interface CreateLeaveRequestInput {
  leave_type_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason?: string;
}

export async function createLeaveRequest(
  input: CreateLeaveRequestInput
): Promise<ServiceResult<LeaveRequest>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    };
  }

  // Validate dates
  if (!input.leave_type_id || !input.start_date || !input.end_date) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'leave_type_id, start_date, and end_date are required.' },
    };
  }

  if (input.start_date > input.end_date) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'End date cannot be before start date.' },
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

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type_id: input.leave_type_id,
        start_date: input.start_date,
        end_date: input.end_date,
        reason: input.reason || null,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as LeaveRequest,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * getMyLeaveRequests()
 * Employee gets their own leave requests.
 */
export interface GetMyLeaveRequestsFilters {
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export async function getMyLeaveRequests(
  filters: GetMyLeaveRequestsFilters = {}
): Promise<ServiceResult<LeaveRequest[]>> {
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

    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data as LeaveRequest[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * getMyLeaveRequest(request_id)
 * Employee gets a single leave request with details.
 */
export interface MyLeaveRequestDetails {
  leave_request: LeaveRequest;
  leave_type: LeaveType;
  approval: LeaveApproval | null;
}

export async function getMyLeaveRequest(
  requestId: string
): Promise<ServiceResult<MyLeaveRequestDetails>> {
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

    // Get leave request (verify ownership)
    const { data: leaveRequest, error: requestError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .eq('employee_id', employeeId)
      .single();

    if (requestError || !leaveRequest) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Leave request not found.' },
      };
    }

    // Get leave type
    const { data: leaveType, error: typeError } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', leaveRequest.leave_type_id)
      .single();

    if (typeError) throw typeError;

    // Get approval (if any)
    const { data: approval, error: approvalError } = await supabase
      .from('leave_approvals')
      .select('*')
      .eq('leave_request_id', requestId)
      .maybeSingle();

    if (approvalError) throw approvalError;

    return {
      data: {
        leave_request: leaveRequest as LeaveRequest,
        leave_type: leaveType as LeaveType,
        approval: (approval as LeaveApproval) ?? null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * getLeaveRequests()
 * Admin only - returns all leave requests.
 */
export interface GetLeaveRequestsFilters {
  status?: 'Pending' | 'Approved' | 'Rejected';
  employee_id?: string;
}

export async function getLeaveRequests(
  filters: GetLeaveRequestsFilters = {}
): Promise<ServiceResult<LeaveRequest[]>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    let query = supabase.from('leave_requests').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data as LeaveRequest[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * getLeaveRequest(request_id)
 * Admin only - returns a single leave request with details.
 */
export interface LeaveRequestDetails {
  leave_request: LeaveRequest;
  employee: Employee;
  leave_type: LeaveType;
  approval: LeaveApproval | null;
}

export async function getLeaveRequest(
  requestId: string
): Promise<ServiceResult<LeaveRequestDetails>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    // Get leave request
    const { data: leaveRequest, error: requestError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !leaveRequest) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Leave request not found.' },
      };
    }

    // Get employee
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', leaveRequest.employee_id)
      .single();

    if (empError) throw empError;

    // Get leave type
    const { data: leaveType, error: typeError } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', leaveRequest.leave_type_id)
      .single();

    if (typeError) throw typeError;

    // Get approval (if any)
    const { data: approval, error: approvalError } = await supabase
      .from('leave_approvals')
      .select('*')
      .eq('leave_request_id', requestId)
      .maybeSingle();

    if (approvalError) throw approvalError;

    return {
      data: {
        leave_request: leaveRequest as LeaveRequest,
        employee: employee as Employee,
        leave_type: leaveType as LeaveType,
        approval: (approval as LeaveApproval) ?? null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}