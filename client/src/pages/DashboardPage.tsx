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
  useDashboardStatistics,
} from '@/features/statistics/useStatistics';
import type { AppLanguage } from '@/i18n';
import { formatDate } from '@/utils/date';

function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
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
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();

  if (dashboardQuery.isLoading || activityQuery.isLoading) {
    return <Loader />;
  }

  if (dashboardQuery.isError || activityQuery.isError || !dashboardQuery.data || !activityQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { stats, nextReminder, recentMaterials } = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {t('dashboard.welcome', { name: user?.name ?? '' })}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
          <p className="mt-2 text-xs text-muted">
            {t('dashboard.timezone', { timezone: dashboardQuery.data.timezone })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/review">
            <Button>{t('nav.review')}</Button>
          </Link>
          <Link to="/materials/new">
            <Button variant="secondary">{t('materials.create')}</Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('dashboard.stats.activeMaterials')} value={stats.activeMaterials} />
        <StatCard label={t('dashboard.stats.todayReminders')} value={stats.todayReminders} />
        <StatCard
          label={t('dashboard.stats.overdueReminders')}
          value={stats.overdueReminders}
          tone={stats.overdueReminders > 0 ? 'danger' : 'default'}
        />
        <StatCard label={t('dashboard.stats.completedReviews')} value={stats.completedReviews} />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
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
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 no-underline shadow-sm ring-1 ring-brand-100"
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
