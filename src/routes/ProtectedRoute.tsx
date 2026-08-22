import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};