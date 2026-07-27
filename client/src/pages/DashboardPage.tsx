import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivityChart } from '@/components/statistics/ActivityChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/features/auth/useAuth';
import {
  useActivityStatistics,
  useOverviewStatistics,
} from '@/features/statistics/useStatistics';
import type { AppLanguage } from '@/i18n';
import { formatDate } from '@/utils/date';

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone === 'danger' ? 'text-red-700' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const overviewQuery = useOverviewStatistics();
  const activityQuery = useActivityStatistics();

  if (overviewQuery.isLoading || activityQuery.isLoading) {
    return <Loader />;
  }

  if (overviewQuery.isError || activityQuery.isError || !overviewQuery.data || !activityQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { reviews, planner, habits, budget, nextReminder, recentMaterials } = overviewQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {t('dashboard.welcome', { name: user?.name ?? '' })}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
          <p className="mt-2 text-xs text-muted">
            {t('dashboard.timezone', { timezone: overviewQuery.data.timezone })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/review">
            <Button>{t('nav.review')}</Button>
          </Link>
          <Link to="/planner">
            <Button variant="secondary">{t('nav.planner')}</Button>
          </Link>
          <Link to="/habits">
            <Button variant="secondary">{t('nav.habits')}</Button>
          </Link>
          <Link to="/budget">
            <Button variant="secondary">{t('nav.budget')}</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('statistics.sections.reviews')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t('dashboard.stats.activeMaterials')} value={reviews.activeMaterials} />
          <StatCard label={t('dashboard.stats.todayReminders')} value={reviews.todayReminders} />
          <StatCard
            label={t('dashboard.stats.overdueReminders')}
            value={reviews.overdueReminders}
            tone={reviews.overdueReminders > 0 ? 'danger' : 'default'}
          />
          <StatCard label={t('dashboard.stats.completedReviews')} value={reviews.completedReviews} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link
          to="/planner"
          className="rounded-2xl bg-panel p-4 no-underline shadow-sm ring-1 ring-line transition hover:ring-brand-400"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('nav.planner')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{planner.pendingOccurrences}</p>
          <p className="mt-1 text-sm text-muted">{t('dashboard.pillars.plannerOpen')}</p>
          {planner.overdueOccurrences > 0 ? (
            <p className="mt-2 text-sm font-medium text-red-700">
              {t('dashboard.pillars.plannerOverdue', { count: planner.overdueOccurrences })}
            </p>
          ) : null}
        </Link>
        <Link
          to="/habits"
          className="rounded-2xl bg-panel p-4 no-underline shadow-sm ring-1 ring-line transition hover:ring-brand-400"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('nav.habits')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {habits.completedToday}/{habits.activeHabits}
          </p>
          <p className="mt-1 text-sm text-muted">{t('dashboard.pillars.habitsToday')}</p>
          <p className="mt-2 text-sm text-muted">
            {t('dashboard.pillars.streak', { count: habits.streak })}
          </p>
        </Link>
        <Link
          to="/budget"
          className="rounded-2xl bg-panel p-4 no-underline shadow-sm ring-1 ring-line transition hover:ring-brand-400"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t('nav.budget')}
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {budget.currentBalance} {budget.displayCurrency}
          </p>
          <p className="mt-1 text-sm text-muted">{t('dashboard.pillars.budgetBalance')}</p>
          <p className="mt-2 text-sm text-muted">
            {t('dashboard.pillars.mandatoryPaid', {
              paid: budget.mandatoryPaid,
              total: budget.mandatoryTotal,
            })}
          </p>
        </Link>
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('dashboard.nextReviewTitle')}</h2>
        {nextReminder ? (
          <div className="mt-3 space-y-2">
            <p className="text-lg font-medium text-ink">{nextReminder.material.title}</p>
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <span>
                {t('review.scheduledAt')}: {formatDate(nextReminder.scheduledAt, language)}
              </span>
              <span>
                #{nextReminder.sequenceNumber} ·{' '}
                {t(`materials.intervals.${nextReminder.intervalType}`)}
              </span>
              {nextReminder.material.category ? (
                <span>{nextReminder.material.category.name}</span>
              ) : null}
              <Badge tone={nextReminder.status === 'OVERDUE' ? 'danger' : 'warning'}>
                {t(`materials.reminderStatus.${nextReminder.status}`)}
              </Badge>
            </div>
            <div className="pt-2">
              <Link to="/review">
                <Button variant="secondary">{t('dashboard.goToReview')}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{t('dashboard.noNextReview')}</p>
        )}
      </section>

      <ActivityChart activity={activityQuery.data.activity} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">{t('dashboard.recentTitle')}</h2>
          <Link to="/materials" className="text-sm font-medium text-brand-700">
            {t('dashboard.viewAllMaterials')}
          </Link>
        </div>

        {recentMaterials.length === 0 ? (
          <EmptyState
            title={t('materials.emptyTitle')}
            description={t('materials.emptyDescription')}
            action={
              <Link to="/materials/new">
                <Button>{t('materials.create')}</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {recentMaterials.map((material) => (
              <li key={material.id}>
                <Link
                  to={`/materials/${material.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-panel px-4 py-3 no-underline shadow-sm ring-1 ring-line"
                >
                  <div>
                    <p className="font-medium text-ink">{material.title}</p>
                    <p className="text-xs text-muted">
                      {material.category?.name ?? t('materials.fields.noCategory')} ·{' '}
                      {formatDate(material.learnedAt, language)}
                    </p>
                  </div>
                  <Badge tone={material.status === 'ARCHIVED' ? 'neutral' : 'success'}>
                    {t(`materials.status.${material.status}`)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
