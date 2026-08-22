import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/features/auth/auth-context"
import { paths } from "@/routes/paths"
import type { UserRole } from "@/types/domain"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-df-bg">
        <div className="size-8 animate-spin rounded-full border-2 border-df-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={paths.signIn} state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={paths.signIn} replace />
  if (!allow.includes(user.profile.role)) {
    return <Navigate to={paths.unauthorized} replace />
  }
  return <Outlet />
}

export function GuestRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to={paths.dashboard} replace />
  return <Outlet />
}
