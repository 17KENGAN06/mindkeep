import { useTranslation } from 'react-i18next';
import { ActivityChart } from '@/components/statistics/ActivityChart';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import {
  useActivityStatistics,
  useDashboardStatistics,
} from '@/features/statistics/useStatistics';

export function StatisticsPage() {
  const { t } = useTranslation();
  const dashboardQuery = useDashboardStatistics();
  const activityQuery = useActivityStatistics();

  if (dashboardQuery.isLoading || activityQuery.isLoading) return <Loader />;
  if (dashboardQuery.isError || activityQuery.isError || !dashboardQuery.data || !activityQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { stats } = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('statistics.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('statistics.subtitle')}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <p className="text-xs text-muted uppercase">{t('dashboard.stats.activeMaterials')}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{stats.activeMaterials}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <p className="text-xs text-muted uppercase">{t('dashboard.stats.todayReminders')}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{stats.todayReminders}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <p className="text-xs text-muted uppercase">{t('dashboard.stats.overdueReminders')}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{stats.overdueReminders}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <p className="text-xs text-muted uppercase">{t('dashboard.stats.completedReviews')}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{stats.completedReviews}</p>
        </div>
      </section>

      <ActivityChart activity={activityQuery.data.activity} />
    </div>
  );
}
