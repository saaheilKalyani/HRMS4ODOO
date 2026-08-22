import { supabase } from '../../lib/supabase/client';
import type { Employee } from '../../types';

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
    return { code: 'CONFLICT', message: 'A record with this value already exists.' };
  }

  if (message.toLowerCase().includes('not found')) {
    return { code: 'NOT_FOUND', message: 'Requested record was not found.' };
  }

  return { code: 'DATABASE_ERROR', message };
};

async function isAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' && profile?.is_active === true;
}

export interface GetEmployeesFilters {
  search?: string;
  department?: string;
  employment_status?: 'Active' | 'Inactive';
}

export async function getEmployees(
  filters: GetEmployeesFilters = {}
): Promise<ServiceResult<Employee[]>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    let query = supabase.from('employees').select('*');

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%,department.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`
      );
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.employment_status) {
      query = query.eq('employment_status', filters.employment_status);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) throw error;

    return {
      data: data as Employee[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export async function getEmployee(
  employeeId: string
): Promise<ServiceResult<Employee>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) throw error;

    if (!data) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Employee not found.' },
      };
    }

    return {
      data: data as Employee,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface CreateEmployeeInput {
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  department?: string;
  job_title?: string;
  joining_date?: string;
  employment_status?: 'Active' | 'Inactive';
  profile_picture_url?: string;
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<ServiceResult<Employee>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    const { data, error } = await supabase.rpc('create_employee_with_auth', {
      p_email: input.email,
      p_full_name: input.full_name,
      p_phone: input.phone || null,
      p_address: input.address || null,
      p_department: input.department || null,
      p_job_title: input.job_title || null,
      p_joining_date: input.joining_date || null,
      p_employment_status: input.employment_status || 'Active',
      p_profile_picture_url: input.profile_picture_url || null,
    });

    if (error) throw error;

    return {
      data: data as Employee,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface UpdateEmployeeInput {
  full_name?: string;
  phone?: string;
  address?: string;
  department?: string;
  job_title?: string;
  joining_date?: string;
  employment_status?: 'Active' | 'Inactive';
  profile_picture_url?: string;
}

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput
): Promise<ServiceResult<Employee>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  const payload: Partial<UpdateEmployeeInput> = {};
  if (input.full_name !== undefined) payload.full_name = input.full_name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.address !== undefined) payload.address = input.address;
  if (input.department !== undefined) payload.department = input.department;
  if (input.job_title !== undefined) payload.job_title = input.job_title;
  if (input.joining_date !== undefined) payload.joining_date = input.joining_date;
  if (input.employment_status !== undefined) payload.employment_status = input.employment_status;
  if (input.profile_picture_url !== undefined) payload.profile_picture_url = input.profile_picture_url;

  if (Object.keys(payload).length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update.' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Employee not found.' },
      };
    }

    return {
      data: data as Employee,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}