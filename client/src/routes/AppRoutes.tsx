import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireModule } from '@/components/RequireModule';
import { RouteErrorBoundary } from '@/components/layout/RouteErrorBoundary';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';
import { HomePage } from '@/pages/HomePage';
import { DEFAULT_LANGUAGE, isSeoLanguage, localizePath, PREFIXED_LANGUAGES, stripLocale } from '@/seo/locale';

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
const BillingReturnPage = lazyNamed(() => import('@/pages/BillingReturnPage'), 'BillingReturnPage');
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
const GuidePage = lazyNamed(() => import('@/pages/GuidePage'), 'GuidePage');
const FeaturePage = lazyNamed(() => import('@/pages/FeaturePage'), 'FeaturePage');
const OnboardingPage = lazyNamed(() => import('@/pages/OnboardingPage'), 'OnboardingPage');
const PlansPage = lazyNamed(() => import('@/pages/PlansPage'), 'PlansPage');
const SettingsPage = lazyNamed(() => import('@/pages/SettingsPage'), 'SettingsPage');
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
const TermsPage = lazyNamed(() => import('@/pages/TermsPage'), 'TermsPage');
const AccountDeletionPage = lazyNamed(() => import('@/pages/AccountDeletionPage'), 'AccountDeletionPage');
const CookiePolicyPage = lazyNamed(() => import('@/pages/CookiePolicyPage'), 'CookiePolicyPage');
const RefundPolicyPage = lazyNamed(() => import('@/pages/RefundPolicyPage'), 'RefundPolicyPage');
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

/** The language prefix whose language was last applied (the path detector applies the first one). */
let appliedPrefix: string | undefined = stripLocale(window.location.pathname).lang ?? undefined;

/** Unprefixed public pages are English; a visitor in another language moves to their prefix. */
function DefaultLocaleGate() {
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    appliedPrefix = undefined;
  }, []);

  if (isSeoLanguage(lang) && lang !== DEFAULT_LANGUAGE) {
    return <Navigate to={`${localizePath(pathname, lang)}${search}${hash}`} replace />;
  }
  return <Outlet />;
}

/** `/:lang/...` — a known prefix switches the language; `/en/...` drops the prefix. */
function LocaleGate() {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const valid = (PREFIXED_LANGUAGES as readonly string[]).includes(lang ?? '');

  useEffect(() => {
    // Apply the prefix only when arriving at it. The tree remounts when the language
    // changes, and re-applying then would undo the language switcher.
    if (!valid || !lang || lang === appliedPrefix) return;
    appliedPrefix = lang;
    if (i18n.resolvedLanguage !== lang) void i18n.changeLanguage(lang);
  }, [i18n, lang, valid]);

  if (lang === DEFAULT_LANGUAGE) {
    return <Navigate to={`${pathname.slice(3) || '/'}${search}${hash}`} replace />;
  }
  if (!valid) return <NotFoundPage />;
  return <Outlet />;
}

/** The public routes, as absolute paths (`base = '/'`) or relative to `/:lang` (`base = ''`). */
function publicPageRoutes(base: '/' | '') {
  const page = (path: string, element: ReactNode, maintenance = true) => (
    <Route
      key={path || 'home'}
      {...(path ? { path: `${base}${path}` } : base ? { path: '/' } : { index: true })}
      element={maintenance ? <MaintenanceHome>{element}</MaintenanceHome> : element}
    />
  );
  return [
    page('', <HomePage />, false),
    page('blog', <BlogPage />),
    page('blog/:slug', <BlogArticlePage />),
    page('guide', <GuidePage />),
    page('features/:slug', <FeaturePage />),
    page('privacy', <PrivacyPolicyPage />),
    page('delete-account', <AccountDeletionPage />),
    page('terms', <TermsPage />),
    page('cookies', <CookiePolicyPage />),
    page('refund', <RefundPolicyPage />),
    page('contact', <ContactPage />, false),
    page('plans', <PlansPage />),
  ];
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        {/* Public pages: English without a prefix, other languages under /:lang. */}
        <Route element={<DefaultLocaleGate />}>{publicPageRoutes('/')}</Route>
        <Route path="/:lang" element={<LocaleGate />}>
          {publicPageRoutes('')}
        </Route>
        <Route path="/billing/return" element={<BillingReturnPage />} />

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
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route
              path="/tasks"
              element={
                <RequireModule module="tasks">
                  <TasksPage />
                </RequireModule>
              }
            />
            <Route
              path="/calendar"
              element={
                <RequireModule module="review">
                  <CalendarPage />
                </RequireModule>
              }
            />
            <Route
              path="/month-plan"
              element={
                <RequireModule module="tasks">
                  <MonthPlanPage />
                </RequireModule>
              }
            />
            <Route
              path="/nutrition"
              element={
                <RequireModule module="nutrition">
                  <CaloriesPage />
                </RequireModule>
              }
            />
            <Route path="/calories" element={<Navigate to="/nutrition" replace />} />
            <Route
              path="/habits"
              element={
                <RequireModule module="habits">
                  <RhythmPage />
                </RequireModule>
              }
            />
            <Route path="/rhythm" element={<Navigate to="/habits" replace />} />
            <Route
              path="/notes"
              element={
                <RequireModule module="notes">
                  <NotesPage />
                </RequireModule>
              }
            />
            <Route
              path="/notes/new"
              element={
                <RequireModule module="notes">
                  <NoteCreatePage />
                </RequireModule>
              }
            />
            <Route
              path="/notes/:id"
              element={
                <RequireModule module="notes">
                  <NoteDetailPage />
                </RequireModule>
              }
            />
            <Route
              path="/notes/:id/edit"
              element={
                <RequireModule module="notes">
                  <NoteEditPage />
                </RequireModule>
              }
            />
            <Route
              path="/review"
              element={
                <RequireModule module="review">
                  <ReviewPage />
                </RequireModule>
              }
            />
            <Route
              path="/materials"
              element={
                <RequireModule module="review">
                  <MaterialsPage />
                </RequireModule>
              }
            />
            <Route
              path="/materials/new"
              element={
                <RequireModule module="review">
                  <MaterialCreatePage />
                </RequireModule>
              }
            />
            <Route
              path="/materials/:id"
              element={
                <RequireModule module="review">
                  <MaterialDetailPage />
                </RequireModule>
              }
            />
            <Route
              path="/materials/:id/edit"
              element={
                <RequireModule module="review">
                  <MaterialEditPage />
                </RequireModule>
              }
            />
            <Route
              path="/categories"
              element={
                <RequireModule module="review">
                  <CategoriesPage />
                </RequireModule>
              }
            />
            <Route
              path="/finance"
              element={
                <RequireModule module="finance">
                  <FinanceBudgetPage />
                </RequireModule>
              }
            />
            <Route
              path="/finance/transactions"
              element={
                <RequireModule module="finance">
                  <FinanceTransactionsPage />
                </RequireModule>
              }
            />
            <Route
              path="/finance/categories"
              element={
                <RequireModule module="finance">
                  <FinanceCategoriesPage />
                </RequireModule>
              }
            />
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
