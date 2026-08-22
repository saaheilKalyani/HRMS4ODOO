import { supabase } from '../../lib/supabase/client';
import type { AttendanceRecord, AttendanceStatus } from '../../types';

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

  if (message.toLowerCase().includes('duplicate key')) {
    return { code: 'CONFLICT', message: 'Attendance already exists for this date.' };
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

export async function getTodayAttendance(): Promise<ServiceResult<AttendanceRecord | null>> {
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

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (error) throw error;

    return {
      data: (data as AttendanceRecord) ?? null,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export async function checkIn(): Promise<ServiceResult<AttendanceRecord>> {
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

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        employee_id: employeeId,
        attendance_date: today,
        check_in: new Date().toISOString(),
        status: 'Present',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as AttendanceRecord,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export async function checkOut(): Promise<ServiceResult<AttendanceRecord>> {
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

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .single();

    if (fetchError || !existingRecord) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'No check-in record found for today. Please check in first.' },
      };
    }

    if (!existingRecord.check_in) {
      return {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot check out without check-in.' },
      };
    }

    if (existingRecord.check_out) {
      return {
        data: null,
        error: { code: 'CONFLICT', message: 'Already checked out for today.' },
      };
    }

    if (new Date(now) <= new Date(existingRecord.check_in)) {
      return {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Check-out must be after check-in.' },
      };
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update({ check_out: now })
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as AttendanceRecord,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface GetMyAttendanceFilters {
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}

export async function getMyAttendance(
  filters: GetMyAttendanceFilters = {}
): Promise<ServiceResult<AttendanceRecord[]>> {
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
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId);

    if (filters.from) {
      query = query.gte('attendance_date', filters.from);
    }

    if (filters.to) {
      query = query.lte('attendance_date', filters.to);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('attendance_date', { ascending: false });

    if (error) throw error;

    return {
      data: data as AttendanceRecord[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface GetAttendanceFilters {
  employee_id?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}

export async function getAttendance(
  filters: GetAttendanceFilters = {}
): Promise<ServiceResult<AttendanceRecord[]>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    let query = supabase.from('attendance_records').select('*');

    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }

    if (filters.from) {
      query = query.gte('attendance_date', filters.from);
    }

    if (filters.to) {
      query = query.lte('attendance_date', filters.to);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('attendance_date', { ascending: false });

    if (error) throw error;

    return {
      data: data as AttendanceRecord[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}