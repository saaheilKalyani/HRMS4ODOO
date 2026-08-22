import { supabase } from '../../lib/supabase/client';

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

  if (message.toLowerCase().includes('forbidden')) {
    return { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' };
  }

  if (message.toLowerCase().includes('not found')) {
    return { code: 'NOT_FOUND', message: 'Leave request not found.' };
  }

  if (message.toLowerCase().includes('conflict') || message.toLowerCase().includes('already processed')) {
    return { code: 'CONFLICT', message: 'Leave request is already processed.' };
  }

  if (message.toLowerCase().includes('jwt expired') || message.toLowerCase().includes('unauthorized')) {
    return { code: 'UNAUTHORIZED', message: 'Authentication is required.' };
  }

  return { code: 'OPERATION_FAILED', message };
};

/**
 * approveLeave()
 * Admin only - approves a leave request transactionally.
 * 
 * This calls the PostgreSQL RPC function that:
 * 1. Verifies admin
 * 2. Verifies request exists
 * 3. Verifies request is Pending
 * 4. Creates leave_approval
 * 5. Updates leave_requests status to Approved
 * 6. Creates/updates attendance records with status 'Leave'
 * 7. COMMIT
 */
export interface ApproveLeaveInput {
  leave_request_id: string;
  comment?: string;
}

export async function approveLeave(
  input: ApproveLeaveInput
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    const { error } = await supabase.rpc('approve_leave', {
      p_leave_request_id: input.leave_request_id,
      p_comment: input.comment || null,
    });

    if (error) throw error;

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * rejectLeave()
 * Admin only - rejects a leave request transactionally.
 * 
 * This calls the PostgreSQL RPC function that:
 * 1. Verifies admin
 * 2. Verifies request exists
 * 3. Verifies request is Pending
 * 4. Creates leave_approval with decision 'Rejected'
 * 5. Updates leave_requests status to Rejected
 * 6. COMMIT
 * 
 * No attendance records are created for rejected leave.
 */
export interface RejectLeaveInput {
  leave_request_id: string;
  comment?: string;
}

export async function rejectLeave(
  input: RejectLeaveInput
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    const { error } = await supabase.rpc('reject_leave', {
      p_leave_request_id: input.leave_request_id,
      p_comment: input.comment || null,
    });

    if (error) throw error;

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}