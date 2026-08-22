import { supabase } from '../../lib/supabase/client';
import type { LeaveType } from '../../types';

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

  return { code: 'DATABASE_ERROR', message };
};

export async function getLeaveTypes(): Promise<ServiceResult<LeaveType[]>> {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      data: data as LeaveType[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export async function getLeaveTypeById(
  leaveTypeId: string
): Promise<ServiceResult<LeaveType>> {
  try {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('id', leaveTypeId)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Leave type not found.' },
      };
    }

    return {
      data: data as LeaveType,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}