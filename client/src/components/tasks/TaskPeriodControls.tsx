import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { yearOptions } from '@/features/finance/financeUtils';
import type { DailyTaskView } from '@/types/dailyTask';

type PeriodControlsProps = {
  view: DailyTaskView;
  year: number;
  month: number;
  onViewChange: (view: DailyTaskView) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

export function TaskPeriodControls({
  view,
  year,
  month,
  onViewChange,
  onYearChange,
  onMonthChange,
}: PeriodControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={view === 'month' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('month')}
        >
          {t('tasks.viewMonth')}
        </Button>
        <Button
          type="button"
          variant={view === 'year' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('year')}
        >
          {t('tasks.viewYear')}
        </Button>
      </div>

      <div className="grid max-w-md flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label={t('tasks.year')}
          value={String(year)}
          onChange={(event) => onYearChange(Number(event.target.value))}
          options={yearOptions().map((value) => ({
            value: String(value),
            label: String(value),
          }))}
        />
        {view === 'month' ? (
          <Select
            label={t('tasks.month')}
            value={String(month)}
            onChange={(event) => onMonthChange(Number(event.target.value))}
            options={Array.from({ length: 12 }, (_, index) => ({
              value: String(index + 1),
              label: t(`finance.months.${index + 1}`),
            }))}
          />
        ) : null}
      </div>
    </div>
  );
}
