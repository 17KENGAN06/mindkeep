import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { BlogArticlePage, BlogPage } from '@/pages/BlogPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { FinanceBudgetPage } from '@/pages/finance/FinanceBudgetPage';
import { FinanceCategoriesPage } from '@/pages/finance/FinanceCategoriesPage';
import { FinanceTransactionsPage } from '@/pages/finance/FinanceTransactionsPage';
import { GuidePage } from '@/pages/GuidePage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MaterialCreatePage } from '@/pages/MaterialCreatePage';
import { MaterialDetailPage } from '@/pages/MaterialDetailPage';
import { MaterialEditPage } from '@/pages/MaterialEditPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { MonthPlanPage } from '@/pages/MonthPlanPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { TasksPage } from '@/pages/TasksPage';

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (env.maintenanceMode) {
    if (isAuthenticated && user?.role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function MaintenanceHome({ children }: { children: ReactNode }) {
  if (env.maintenanceMode) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/blog"
        element={
          <MaintenanceHome>
            <BlogPage />
          </MaintenanceHome>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <MaintenanceHome>
            <BlogArticlePage />
          </MaintenanceHome>
        }
      />
      <Route
        path="/guide"
        element={
          <MaintenanceHome>
            <GuidePage />
          </MaintenanceHome>
        }
      />
      <Route
        path="/privacy"
        element={
          <MaintenanceHome>
            <PrivacyPolicyPage />
          </MaintenanceHome>
        }
      />

      <Route
        element={
          <PublicOnly>
            <AuthLayout />
          </PublicOnly>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            env.maintenanceMode ? <Navigate to="/" replace /> : <RegisterPage />
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/month-plan" element={<MonthPlanPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/new" element={<MaterialCreatePage />} />
          <Route path="/materials/:id" element={<MaterialDetailPage />} />
          <Route path="/materials/:id/edit" element={<MaterialEditPage />} />
          <Route path="/categories" element={<Navigate to="/materials" replace />} />
          <Route path="/finance" element={<FinanceBudgetPage />} />
          <Route path="/finance/transactions" element={<FinanceTransactionsPage />} />
          <Route path="/finance/categories" element={<FinanceCategoriesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
