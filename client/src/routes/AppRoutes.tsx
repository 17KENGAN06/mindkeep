import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/features/auth/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CalendarPage } from '@/pages/CalendarPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MaterialCreatePage } from '@/pages/MaterialCreatePage';
import { MaterialDetailPage } from '@/pages/MaterialDetailPage';
import { MaterialEditPage } from '@/pages/MaterialEditPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { StatisticsPage } from '@/pages/StatisticsPage';

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        element={
          <PublicOnly>
            <AuthLayout />
          </PublicOnly>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/new" element={<MaterialCreatePage />} />
          <Route path="/materials/:id" element={<MaterialDetailPage />} />
          <Route path="/materials/:id/edit" element={<MaterialEditPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
