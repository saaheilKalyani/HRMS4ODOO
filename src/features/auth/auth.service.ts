import { supabase } from '../../lib/supabase/client';
import type { Profile, Employee } from '../../types';

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
    message.toLowerCase().includes('invalid login credentials') ||
    message.toLowerCase().includes('invalid email or password')
  ) {
    return { code: 'AUTH_ERROR', message: 'Invalid email or password.' };
  }

  if (
    message.toLowerCase().includes('duplicate key') ||
    message.toLowerCase().includes('already registered')
  ) {
    return { code: 'CONFLICT', message: 'An account with this email already exists.' };
  }

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

// ---------- Helpers ----------
async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

async function fetchEmployeeByProfileId(profileId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) throw error;
  return (data as Employee) ?? null;
}

// ---------- SIGN UP ----------
export interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
}

export interface SignUpResult {
  user: any;
  session: any | null;
  requires_email_verification: boolean;
}

export async function signUp(input: SignUpInput): Promise<ServiceResult<SignUpResult>> {
  const { email, password, full_name } = input;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }

  return {
    data: {
      user: data.user,
      session: data.session,
      requires_email_verification: !data.session,
    },
    error: null,
  };
}

// ---------- SIGN IN ----------
export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInResult {
  user: any;
  session: any;
  profile: Profile;
}

export async function signIn(input: SignInInput): Promise<ServiceResult<SignInResult>> {
  const { email, password } = input;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }

  if (!data.user) {
    return { data: null, error: { code: 'AUTH_ERROR', message: 'No user returned.' } };
  }

  try {
    const profile = await fetchProfile(data.user.id);
    return {
      data: {
        user: data.user,
        session: data.session,
        profile,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: mapSupabaseError(err) };
  }
}

// ---------- SIGN OUT ----------
export async function signOut(): Promise<ServiceResult<{ success: boolean }>> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
  return { data: { success: true }, error: null };
}

// ---------- GET CURRENT SESSION ----------
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
  return { data: data.session, error: null };
}

// ---------- GET CURRENT USER ----------
export interface CurrentUserResult {
  auth_user: {
    id: string;
    email: string;
  };
  profile: Profile;
  employee: Employee | null;
}

export async function getCurrentUser(): Promise<ServiceResult<CurrentUserResult>> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }

  if (!user) {
    return {
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    };
  }

  try {
    const profile = await fetchProfile(user.id);
    const employee = await fetchEmployeeByProfileId(user.id);

    return {
      data: {
        auth_user: {
          id: user.id,
          email: user.email ?? '',
        },
        profile,
        employee,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: mapSupabaseError(err) };
  }
}

// ---------- PASSWORD RESET ----------
export async function requestPasswordReset(email: string): Promise<ServiceResult<{ success: boolean }>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }

  return { data: { success: true }, error: null };
}

export async function updatePassword(newPassword: string): Promise<ServiceResult<{ success: boolean }>> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { data: null, error: mapSupabaseError(error) };
  }

  return { data: { success: true }, error: null };
}