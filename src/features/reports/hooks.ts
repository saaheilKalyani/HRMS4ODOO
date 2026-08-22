import { useQuery } from "@tanstack/react-query"

import {
  getAdminDashboard as getAdminDashboardReal,
  getEmployeeDashboard as getEmployeeDashboardReal,
  type AdminDashboardData,
  type EmployeeDashboardData,
} from "@/features/reports/dashboard.service"

export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ["dashboard", "employee"],
    queryFn: async (): Promise<EmployeeDashboardData> => {
      const { data, error } = await getEmployeeDashboardReal()
      if (error) throw new Error(error.message)
      if (!data) throw new Error("No dashboard data returned.")
      return data
    },
  })
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async (): Promise<AdminDashboardData> => {
      const { data, error } = await getAdminDashboardReal()
      if (error) throw new Error(error.message)
      if (!data) throw new Error("No dashboard data returned.")
      return data
    },
  })
}
