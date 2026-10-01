import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';
import { HomePage } from '@/pages/HomePage';

function lazyNamed(importer: () => Promise<Record<string, ComponentType>>, exportName: string) {
  const load = () =>
    importer().then((mod) => {
      const Page = mod[exportName];
      if (!Page) {
        throw new Error(`Missing export ${exportName}`);
      }
      return { default: Page };
    });

  return lazy(() =>
    load().catch(() =>
      new Promise<{ default: ComponentType }>((resolve, reject) => {
        window.setTimeout(() => {
          void load()
            .then(resolve)
            .catch((error: unknown) => {
              const text = String(error instanceof Error ? error.message : error);
              if (
                /Failed to fetch|Loading chunk|dynamically imported|Importing a module script failed|error loading dynamically imported module/i.test(
                  text,
                )
              ) {
                window.location.reload();
                return;
              }
              reject(error);
            });
        }, 280);
      }),
    ),
  );
}

const AuthLayout = lazyNamed(() => import('@/layouts/AuthLayout'), 'AuthLayout');
const DashboardLayout = lazyNamed(() => import('@/layouts/DashboardLayout'), 'DashboardLayout');
const BlogPage = lazyNamed(() => import('@/pages/BlogPage'), 'BlogPage');
const BlogArticlePage = lazyNamed(() => import('@/pages/BlogPage'), 'BlogArticlePage');
const CalendarPage = lazyNamed(() => import('@/pages/CalendarPage'), 'CalendarPage');
const CaloriesPage = lazyNamed(() => import('@/pages/CaloriesPage'), 'CaloriesPage');
const CategoriesPage = lazyNamed(() => import('@/pages/CategoriesPage'), 'CategoriesPage');
const ContactPage = lazyNamed(() => import('@/pages/ContactPage'), 'ContactPage');
const DashboardPage = lazyNamed(() => import('@/pages/DashboardPage'), 'DashboardPage');
const AdminPage = lazyNamed(() => import('@/pages/AdminPage'), 'AdminPage');
const AdminUserPage = lazyNamed(() => import('@/pages/AdminUserPage'), 'AdminUserPage');
const FinanceBudgetPage = lazyNamed(
  () => import('@/pages/finance/FinanceBudgetPage'),
  'FinanceBudgetPage',
);
const FinanceCategoriesPage = lazyNamed(
  () => import('@/pages/finance/FinanceCategoriesPage'),
  'FinanceCategoriesPage',
);
const FinanceTransactionsPage = lazyNamed(
  () => import('@/pages/finance/FinanceTransactionsPage'),
  'FinanceTransactionsPage',
);
const ForestPage = lazyNamed(() => import('@/pages/ForestPage'), 'ForestPage');
const GuidePage = lazyNamed(() => import('@/pages/GuidePage'), 'GuidePage');
const LoginPage = lazyNamed(() => import('@/pages/LoginPage'), 'LoginPage');
const ForgotPasswordPage = lazyNamed(() => import('@/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('@/pages/ResetPasswordPage'), 'ResetPasswordPage');
const VerifyEmailPage = lazyNamed(() => import('@/pages/VerifyEmailPage'), 'VerifyEmailPage');
const AccountPage = lazyNamed(() => import('@/pages/AccountPage'), 'AccountPage');
const MaterialCreatePage = lazyNamed(() => import('@/pages/MaterialCreatePage'), 'MaterialCreatePage');
const MaterialDetailPage = lazyNamed(() => import('@/pages/MaterialDetailPage'), 'MaterialDetailPage');
const MaterialEditPage = lazyNamed(() => import('@/pages/MaterialEditPage'), 'MaterialEditPage');
const MaterialsPage = lazyNamed(() => import('@/pages/MaterialsPage'), 'MaterialsPage');
const MonthPlanPage = lazyNamed(() => import('@/pages/MonthPlanPage'), 'MonthPlanPage');
const NoteCreatePage = lazyNamed(() => import('@/pages/NoteCreatePage'), 'NoteCreatePage');
const NoteDetailPage = lazyNamed(() => import('@/pages/NoteDetailPage'), 'NoteDetailPage');
const NoteEditPage = lazyNamed(() => import('@/pages/NoteEditPage'), 'NoteEditPage');
const NotesPage = lazyNamed(() => import('@/pages/NotesPage'), 'NotesPage');
const NotFoundPage = lazyNamed(() => import('@/pages/NotFoundPage'), 'NotFoundPage');
const NotificationsPage = lazyNamed(() => import('@/pages/NotificationsPage'), 'NotificationsPage');
const PrivacyPolicyPage = lazyNamed(() => import('@/pages/PrivacyPolicyPage'), 'PrivacyPolicyPage');
const RegisterPage = lazyNamed(() => import('@/pages/RegisterPage'), 'RegisterPage');
const ReviewPage = lazyNamed(() => import('@/pages/ReviewPage'), 'ReviewPage');
const RhythmPage = lazyNamed(() => import('@/pages/RhythmPage'), 'RhythmPage');
const StatisticsPage = lazyNamed(() => import('@/pages/StatisticsPage'), 'StatisticsPage');
const TasksPage = lazyNamed(() => import('@/pages/TasksPage'), 'TasksPage');

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-12 w-12 rounded-2xl border border-brand-500/30 border-t-brand-500" />
    </div>
  );
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return children;
  }

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
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
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
        <Route path="/contact" element={<ContactPage />} />

        <Route
          element={
            <PublicOnly>
              <AuthLayout />
            </PublicOnly>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/register"
            element={env.maintenanceMode ? <Navigate to="/" replace /> : <RegisterPage />}
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/forest" element={<ForestPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/month-plan" element={<MonthPlanPage />} />
            <Route path="/nutrition" element={<CaloriesPage />} />
            <Route path="/calories" element={<Navigate to="/nutrition" replace />} />
            <Route path="/habits" element={<RhythmPage />} />
            <Route path="/rhythm" element={<Navigate to="/habits" replace />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/new" element={<NoteCreatePage />} />
            <Route path="/notes/:id" element={<NoteDetailPage />} />
            <Route path="/notes/:id/edit" element={<NoteEditPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/materials/new" element={<MaterialCreatePage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/materials/:id/edit" element={<MaterialEditPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/finance" element={<FinanceBudgetPage />} />
            <Route path="/finance/transactions" element={<FinanceTransactionsPage />} />
            <Route path="/finance/categories" element={<FinanceCategoriesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users/:id" element={<AdminUserPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
