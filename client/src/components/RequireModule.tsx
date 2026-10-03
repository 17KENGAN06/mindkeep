import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { AppModule } from '@/config/appModules';
import { userHasModule } from '@/config/appModules';
import { useAuth } from '@/features/auth/useAuth';

export function RequireModule({
  module,
  children,
}: {
  module: AppModule;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!userHasModule(user, module)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
