import { useAuth } from "@/features/auth/auth-context"
import { AdminDashboard } from "@/pages/dashboard/admin-dashboard"
import { EmployeeDashboard } from "@/pages/dashboard/employee-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return user.profile.role === "admin" ? (
    <AdminDashboard />
  ) : (
    <EmployeeDashboard />
  )
}
