import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { paths } from './paths';
import type { Role } from '../types';

interface RoleRouteProps {
  allow: Role[];
}

export const RoleRoute = ({ allow }: RoleRouteProps) => {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile || !allow.includes(profile.role)) {
    return <Navigate to={paths.unauthorized} replace />;
  }

  return <Outlet />;
};