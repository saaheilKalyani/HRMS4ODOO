import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { paths } from './paths';

export const ProtectedRoute = () => {
  const { authUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-df-bg">
        <div className="size-8 animate-spin rounded-full border-2 border-df-accent border-t-transparent" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to={paths.signIn} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const { authUser, loading } = useAuth();

  if (loading) return null;
  if (authUser) return <Navigate to={paths.dashboard} replace />;

  return <Outlet />;
};