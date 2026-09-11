import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ForestProgressCard } from '@/components/forest/ForestProgressCard';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useForestSummary } from '@/features/tasks/useDailyTasks';

export function ForestPage() {
  const { t } = useTranslation();
  const forestQuery = useForestSummary();

  if (forestQuery.isLoading) return <Loader />;
  if (forestQuery.isError || !forestQuery.data) {
    return <ErrorMessage message={t('auth.errors.generic')} />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('forest.pageTitle')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('forest.pageSubtitle')}</p>
        </div>
        <Link to="/tasks">
          <Button variant="secondary">{t('forest.backToTasks')}</Button>
        </Link>
      </section>

      <ForestProgressCard
        totalCompleted={forestQuery.data.totalCompleted}
        completedToday={forestQuery.data.completedToday}
        layout="expanded"
        exploreHref={null}
      />

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('forest.rulesTitle')}</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>{t('forest.ruleTrees')}</li>
          <li>{t('forest.ruleGrove')}</li>
          <li>{t('forest.ruleZone')}</li>
        </ul>
      </section>
    </div>
  );
}
