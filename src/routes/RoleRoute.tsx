import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import type { Role } from '../types';

interface RoleRouteProps {
  allowedRole: Role;
  children: React.ReactNode;
  redirectTo?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRole,
  children,
  redirectTo = '/',
}) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile || profile.role !== allowedRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};