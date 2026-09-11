import { ArrowRight, Trees } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type ForestStatsProps = {
  trees: number;
  treesToday: number;
  groveCurrent: number;
  groveSize: number;
  remaining: number;
  plusOne: boolean;
  exploreHref?: string | null;
  variant?: 'aside' | 'banner';
  monthLabel?: string;
};

export function ForestStats({
  trees,
  treesToday,
  groveCurrent,
  groveSize,
  remaining,
  plusOne,
  exploreHref,
  variant = 'aside',
  monthLabel,
}: ForestStatsProps) {
  const { t } = useTranslation();
  const progress = groveSize > 0 ? Math.min(100, (groveCurrent / groveSize) * 100) : 0;
  const compact = variant === 'aside';

  return (
    <div
      className={
        compact
          ? 'relative flex h-full min-w-0 flex-col justify-between gap-1.5'
          : 'relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
      }
    >
      <div className="min-w-0">
        <p
          className={`font-medium tracking-wide text-muted uppercase ${
            compact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {t('forest.title')}
        </p>
        {monthLabel ? (
          <p className={`text-muted ${compact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'}`}>{monthLabel}</p>
        ) : null}
        <div className="mt-1 flex items-baseline gap-2">
          <Trees className={`shrink-0 text-brand-500 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} aria-hidden />
          <p className={`font-semibold text-ink ${compact ? 'text-xl' : 'text-2xl'}`}>
            {t('forest.trees', { count: trees })}
          </p>
          {plusOne ? (
            <span className="animate-fade rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-500">
              {t('forest.plusOne')}
            </span>
          ) : null}
        </div>
        {treesToday > 0 ? (
          <p className={`text-brand-500 ${compact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'}`}>
            {t('forest.addedToday', { count: treesToday })}
          </p>
        ) : null}
      </div>

      <div className={compact ? 'min-w-0' : 'min-w-0 sm:w-72'}>
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium text-ink ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {t('forest.groveProgress', {
              current: Math.round(groveCurrent),
              total: groveSize,
            })}
          </p>
        </div>
        <div
          className={`overflow-hidden rounded-full bg-line/60 ${compact ? 'mt-1 h-1.5' : 'mt-2 h-2'}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={groveSize}
          aria-valuenow={Math.round(groveCurrent)}
        >
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
        </div>
        <p className={`text-muted ${compact ? 'mt-1 text-[11px]' : 'mt-2 text-xs'}`}>
          {groveCurrent >= groveSize
            ? t('forest.remainingDone')
            : t('forest.remaining', { count: remaining })}
        </p>
        {exploreHref ? (
          <Link
            to={exploreHref}
            className={`inline-flex items-center gap-1 whitespace-nowrap font-semibold text-brand-500 no-underline hover:underline ${
              compact ? 'mt-1.5 text-[11px]' : 'mt-3 text-sm'
            }`}
          >
            {t('forest.explore')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
