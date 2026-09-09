import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { yearOptions } from '@/features/finance/financeUtils';
import type { FinanceView } from '@/types/finance';

type FinancePeriodControlsProps = {
  view: FinanceView;
  year: number;
  month: number;
  onViewChange: (view: FinanceView) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

export function FinancePeriodControls({
  view,
  year,
  month,
  onViewChange,
  onYearChange,
  onMonthChange,
}: FinancePeriodControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-panel p-4 shadow-sm ring-1 ring-line sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={view === 'month' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('month')}
        >
          {t('finance.viewMonth')}
        </Button>
        <Button
          type="button"
          variant={view === 'year' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('year')}
        >
          {t('finance.viewYear')}
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
        <Select
          label={t('finance.year')}
          value={String(year)}
          onChange={(event) => onYearChange(Number(event.target.value))}
          options={yearOptions().map((value) => ({
            value: String(value),
            label: String(value),
          }))}
        />
        {view === 'month' ? (
          <Select
            label={t('finance.month')}
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
