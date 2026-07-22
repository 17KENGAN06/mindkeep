import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@/i18n';
import type { ActivityPoint } from '@/types/statistics';
import { formatDate } from '@/utils/date';

type ActivityChartProps = {
  activity: ActivityPoint[];
};

export function ActivityChart({ activity }: ActivityChartProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const max = Math.max(...activity.map((point) => point.count), 1);

  return (
    <div className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
      <h2 className="text-base font-semibold text-ink">{t('dashboard.activityTitle')}</h2>
      <p className="mt-1 text-sm text-muted">{t('dashboard.activitySubtitle')}</p>

      <div className="mt-5 flex h-40 items-end gap-2">
        {activity.map((point) => {
          const height = `${Math.max((point.count / max) * 100, point.count > 0 ? 12 : 4)}%`;

          return (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-lg bg-brand-500 transition-all"
                  style={{ height }}
                  title={`${point.count}`}
                  aria-label={`${point.date}: ${point.count}`}
                />
              </div>
              <span className="text-[10px] text-muted sm:text-xs">
                {formatDate(point.date, language).split(' ').slice(0, 2).join(' ')}
              </span>
              <span className="text-xs font-medium text-ink">{point.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
