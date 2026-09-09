import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={env.maintenanceMode ? '/' : '/login'}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (env.maintenanceMode && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
