import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 rounded-2xl border border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

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
