import { useCallback, useState } from 'react';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  type GetEmployeesFilters,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from './employee.service';
import type { Employee } from '@/types';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async (filters?: GetEmployeesFilters) => {
    setLoading(true);
    setError(null);
    const result = await getEmployees(filters);
    if (result.error) {
      setError(result.error.message);
      setEmployees([]);
    } else {
      setEmployees(result.data || []);
    }
    setLoading(false);
  }, []);

  const loadEmployee = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    const result = await getEmployee(employeeId);
    if (result.error) {
      setError(result.error.message);
      setSelectedEmployee(null);
    } else {
      setSelectedEmployee(result.data);
    }
    setLoading(false);
  }, []);

  const addEmployee = useCallback(async (input: CreateEmployeeInput) => {
    setLoading(true);
    setError(null);
    const result = await createEmployee(input);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return null;
    }
    setLoading(false);
    return result.data as Employee;
  }, []);

  const editEmployee = useCallback(
    async (employeeId: string, input: UpdateEmployeeInput) => {
      setLoading(true);
      setError(null);
      const result = await updateEmployee(employeeId, input);
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return null;
      }
      setLoading(false);
      return result.data as Employee;
    },
    []
  );

  return {
    employees,
    selectedEmployee,
    loading,
    error,
    loadEmployees,
    loadEmployee,
    addEmployee,
    editEmployee,
  };
}