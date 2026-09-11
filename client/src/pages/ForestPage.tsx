import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ForestProgressCard } from '@/components/forest/ForestProgressCard';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { yearOptions } from '@/features/finance/financeUtils';
import { useForestSummary } from '@/features/tasks/useDailyTasks';

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function ForestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaults = currentMonth();
  const yearParam = Number(params.get('year'));
  const monthParam = Number(params.get('month'));
  const year = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : defaults.year;
  const month =
    Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : defaults.month;

  const forestQuery = useForestSummary(year, month);
  const monthLabel = `${t(`finance.months.${month}`)} ${year}`;

  const setPeriod = (nextYear: number, nextMonth: number) => {
    navigate(`/forest?year=${nextYear}&month=${nextMonth}`, { replace: true });
  };

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

      <section className="grid gap-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:grid-cols-2">
        <Select
          label={t('tasks.year')}
          value={String(year)}
          onChange={(event) => setPeriod(Number(event.target.value), month)}
          options={yearOptions().map((value) => ({
            value: String(value),
            label: String(value),
          }))}
        />
        <Select
          label={t('tasks.month')}
          value={String(month)}
          onChange={(event) => setPeriod(year, Number(event.target.value))}
          options={Array.from({ length: 12 }, (_, index) => ({
            value: String(index + 1),
            label: t(`finance.months.${index + 1}`),
          }))}
        />
      </section>

      <ForestProgressCard
        key={`${year}-${month}`}
        totalCompleted={forestQuery.data.totalCompleted}
        completedToday={forestQuery.data.completedToday}
        layout="expanded"
        exploreHref={null}
        monthLabel={monthLabel}
      />

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">{t('forest.rulesTitle')}</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>{t('forest.ruleTrees')}</li>
          <li>{t('forest.ruleGrove')}</li>
          <li>{t('forest.ruleZone')}</li>
          <li>{t('forest.ruleMonth')}</li>
        </ul>
        <p className="mt-4 text-sm text-muted">{t('forest.monthScope')}</p>
      </section>
    </div>
  );
}
