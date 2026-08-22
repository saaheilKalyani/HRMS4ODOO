<<<<<<< Updated upstream
import { QueryClientProvider } from "@tanstack/react-query"
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth/auth-context"
import { AppShell } from "@/layouts/app-shell"
import { queryClient } from "@/lib/query-client"
import ForgotPasswordPage from "@/pages/auth/forgot-password"
import ResetPasswordPage from "@/pages/auth/reset-password"
import SignInPage from "@/pages/auth/sign-in"
import AttendancePage from "@/pages/attendance/attendance-page"
import DashboardPage from "@/pages/dashboard/dashboard-page"
import EmployeeProfilePage from "@/pages/employees/employee-profile-page"
import EmployeesPage from "@/pages/employees/employees-page"
import SalaryOverviewPage from "@/pages/payroll/salary-overview-page"
import NotFoundPage from "@/pages/shared/not-found"
import UnauthorizedPage from "@/pages/shared/unauthorized"
import SettingsPage from "@/pages/settings/settings-page"
import TimeOffPage from "@/pages/time-off/time-off-page"
import { GuestRoute, ProtectedRoute, RoleRoute } from "@/routes/protected-route"
import { paths } from "@/routes/paths"

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <TooltipProvider>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path={paths.signIn} element={<SignInPage />} />
                <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
                <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path={paths.dashboard} element={<DashboardPage />} />
                  <Route path={paths.profile} element={<EmployeeProfilePage mode="self" />} />
                  <Route path={paths.attendance} element={<AttendancePage />} />
                  <Route path={paths.timeOff} element={<TimeOffPage />} />
                  <Route path={paths.settings} element={<SettingsPage />} />
                  <Route path={paths.unauthorized} element={<UnauthorizedPage />} />

                  <Route element={<RoleRoute allow={["admin"]} />}>
                    <Route path={paths.employees} element={<EmployeesPage />} />
                    <Route path="/employees/:employeeId" element={<EmployeeProfilePage mode="directory" />} />
                    <Route path={paths.salary} element={<SalaryOverviewPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="/" element={<Navigate to={paths.dashboard} replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Employee routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRole="employee" redirectTo="/admin">
                  <EmployeeDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRole="admin" redirectTo="/employee">
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
>>>>>>> Stashed changes
}

export default App;