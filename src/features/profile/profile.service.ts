import { supabase } from '@/lib/supabase/client';
import type { Profile, Employee } from '@/types';

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

/**
 * getMyProfile()
 * Returns the authenticated user's profile and employee record.
 */
export interface GetMyProfileResult {
  profile: Profile;
  employee: Employee | null;
}

export async function getMyProfile(): Promise<ServiceResult<GetMyProfileResult>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    };
  }

  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Fetch employee (may be null for admin without employee record)
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', userId)
      .maybeSingle();

    if (employeeError) throw employeeError;

    return {
      data: {
        profile: profile as Profile,
        employee: (employee as Employee) ?? null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

/**
 * updateMyProfile()
 * Updates only allowed employee fields:
 *   - phone
 *   - address
 *   - profile_picture_url
 *
 * All other fields are silently ignored (or can be rejected).
 */
export interface UpdateMyProfileInput {
  phone?: string;
  address?: string;
  profile_picture_url?: string;
}

export async function updateMyProfile(
  input: UpdateMyProfileInput
): Promise<ServiceResult<Employee>> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    };
  }

  // Build payload with ONLY allowed fields.
  const payload: Partial<UpdateMyProfileInput> = {};
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.address !== undefined) payload.address = input.address;
  if (input.profile_picture_url !== undefined)
    payload.profile_picture_url = input.profile_picture_url;

  if (Object.keys(payload).length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update.' },
    };
  }

  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('profile_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      data: employee as Employee,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}