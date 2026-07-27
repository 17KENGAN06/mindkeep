import { useTranslation } from 'react-i18next';
import { ActivityChart } from '@/components/statistics/ActivityChart';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import {
  useActivityStatistics,
  useOverviewStatistics,
} from '@/features/statistics/useStatistics';

export function StatisticsPage() {
  const { t } = useTranslation();
  const overviewQuery = useOverviewStatistics();
  const activityQuery = useActivityStatistics();

  if (overviewQuery.isLoading || activityQuery.isLoading) return <Loader />;
  if (overviewQuery.isError || activityQuery.isError || !overviewQuery.data || !activityQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  const { reviews, planner, habits, budget } = overviewQuery.data;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-ink">{t('statistics.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('statistics.subtitle')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('statistics.sections.reviews')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('dashboard.stats.activeMaterials')} value={reviews.activeMaterials} />
          <Stat label={t('dashboard.stats.todayReminders')} value={reviews.todayReminders} />
          <Stat label={t('dashboard.stats.overdueReminders')} value={reviews.overdueReminders} />
          <Stat label={t('dashboard.stats.completedReviews')} value={reviews.completedReviews} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('statistics.sections.planner')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('planner.stats.total')} value={planner.totalTasks} />
          <Stat label={t('planner.stats.completed')} value={planner.completedOccurrences} />
          <Stat label={t('planner.stats.overdue')} value={planner.overdueOccurrences} />
          <Stat label={t('planner.stats.streak')} value={planner.streak} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('statistics.sections.habits')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('habits.stats.active')} value={habits.activeHabits} />
          <Stat label={t('habits.stats.today')} value={habits.completedToday} />
          <Stat label={t('habits.stats.rate')} value={`${habits.completionRateToday}%`} />
          <Stat label={t('habits.stats.streak')} value={habits.streak} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('statistics.sections.budget')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={t('budget.currentBalance')}
            value={`${budget.currentBalance} ${budget.displayCurrency}`}
          />
          <Stat
            label={t('budget.overview.income')}
            value={`${budget.monthIncome} ${budget.displayCurrency}`}
          />
          <Stat
            label={t('budget.overview.expenses')}
            value={`${budget.monthExpenses} ${budget.displayCurrency}`}
          />
          <Stat
            label={t('budget.overview.mandatory')}
            value={`${budget.mandatoryPaid}/${budget.mandatoryTotal}`}
          />
        </div>
      </section>

      <ActivityChart activity={activityQuery.data.activity} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
    </div>
  );
}
