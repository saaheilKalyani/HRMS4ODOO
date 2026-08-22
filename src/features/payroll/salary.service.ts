import { supabase } from '../../lib/supabase/client';
import type { SalaryStructure } from '../../types';

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

export async function getMySalary(): Promise<ServiceResult<SalaryStructure | null>> {
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
      .from('salary_structures')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('effective_from', today)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      data: (data as SalaryStructure) ?? null,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export async function getEmployeeSalary(
  employeeId: string
): Promise<ServiceResult<SalaryStructure[]>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false });

    if (error) throw error;

    return {
      data: data as SalaryStructure[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface CreateSalaryInput {
  employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  effective_from: string;
}

export async function createSalaryStructure(
  input: CreateSalaryInput
): Promise<ServiceResult<SalaryStructure>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  if (input.basic_salary < 0 || input.allowances < 0 || input.deductions < 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Salary values cannot be negative.' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('salary_structures')
      .insert({
        employee_id: input.employee_id,
        basic_salary: input.basic_salary,
        allowances: input.allowances,
        deductions: input.deductions,
        effective_from: input.effective_from,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as SalaryStructure,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}

export interface UpdateSalaryInput {
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  effective_from?: string;
}

export async function updateSalary(
  salaryId: string,
  input: UpdateSalaryInput
): Promise<ServiceResult<SalaryStructure>> {
  if (!(await isAdmin())) {
    return {
      data: null,
      error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
    };
  }

  const payload: Partial<UpdateSalaryInput> = {};
  if (input.basic_salary !== undefined) payload.basic_salary = input.basic_salary;
  if (input.allowances !== undefined) payload.allowances = input.allowances;
  if (input.deductions !== undefined) payload.deductions = input.deductions;
  if (input.effective_from !== undefined) payload.effective_from = input.effective_from;

  if (Object.keys(payload).length === 0) {
    return {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update.' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('salary_structures')
      .update(payload)
      .eq('id', salaryId)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as SalaryStructure,
      error: null,
    };
  } catch (error) {
    return { data: null, error: mapSupabaseError(error) };
  }
}