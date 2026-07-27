import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/features/auth/useAuth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { BlogArticlePage, BlogPage } from '@/pages/BlogPage';
import { BudgetPage } from '@/pages/BudgetPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { GuidePage } from '@/pages/GuidePage';
import { HabitsPage } from '@/pages/HabitsPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MaterialCreatePage } from '@/pages/MaterialCreatePage';
import { MaterialDetailPage } from '@/pages/MaterialDetailPage';
import { MaterialEditPage } from '@/pages/MaterialEditPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { PlannerOverduePage, PlannerPage } from '@/pages/PlannerPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
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
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogArticlePage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />

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
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/planner/overdue" element={<PlannerOverduePage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
