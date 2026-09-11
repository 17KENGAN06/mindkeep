import { ArrowRight, Trees } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GROVES_PER_ZONE } from '@/features/forest/forestProgress';

type ForestStatsProps = {
  trees: number;
  treesToday: number;
  groveCurrent: number;
  groveSize: number;
  groveNumber: number;
  grovesFilled: number;
  completedZones: number;
  remaining: number;
  remainingZone: number;
  plusOne: boolean;
  celebrateGrove: number | null;
  celebrateZone: boolean;
  exploreHref?: string | null;
  variant?: 'aside' | 'banner';
  monthLabel?: string;
};

function MilestoneTrack({
  grovesFilled,
  groveNumber,
  groveCurrent,
  groveSize,
  completedZones,
  celebrateGrove,
  celebrateZone,
  compact,
}: {
  grovesFilled: number;
  groveNumber: number;
  groveCurrent: number;
  groveSize: number;
  completedZones: number;
  celebrateGrove: number | null;
  celebrateZone: boolean;
  compact: boolean;
}) {
  const { t } = useTranslation();
  const pip = compact ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={t('forest.pathLabel', { grove: groveNumber, zone: completedZones })}
    >
      {Array.from({ length: GROVES_PER_ZONE }, (_, index) => {
        const n = index + 1;
        const filled = n <= grovesFilled;
        const current = n === groveNumber && groveCurrent < groveSize;
        const celebrating = celebrateGrove === n;
        return (
          <span
            key={n}
            className={`${pip} rounded-full transition ${
              filled
                ? 'bg-brand-500'
                : current
                  ? 'bg-brand-500/35 ring-1 ring-brand-500/80'
                  : 'bg-line'
            } ${celebrating ? 'animate-pulse-soft ring-2 ring-brand-400' : ''}`}
            title={t('forest.grovePip', { n })}
          />
        );
      })}
      <span className="mx-0.5 h-3 w-px shrink-0 bg-line/80" aria-hidden />
      <span
        className={`inline-block rotate-45 rounded-[1px] ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${
          completedZones > 0 || celebrateZone
            ? 'bg-brand-500'
            : 'bg-line'
        } ${celebrateZone ? 'animate-pulse-soft ring-1 ring-brand-400' : ''}`}
        title={t('forest.zonePip')}
      />
      {completedZones > 0 ? (
        <span className={`font-semibold text-brand-500 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {t('forest.zonesCount', { count: completedZones })}
        </span>
      ) : (
        <span className={`text-muted ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{t('forest.zonePip')}</span>
      )}
    </div>
  );
}

export function ForestStats({
  trees,
  treesToday,
  groveCurrent,
  groveSize,
  groveNumber,
  grovesFilled,
  completedZones,
  remaining,
  remainingZone,
  plusOne,
  celebrateGrove,
  celebrateZone,
  exploreHref,
  variant = 'aside',
  monthLabel,
}: ForestStatsProps) {
  const { t } = useTranslation();
  const progress = groveSize > 0 ? Math.min(100, (groveCurrent / groveSize) * 100) : 0;
  const compact = variant === 'aside';
  const towardZone = groveNumber >= GROVES_PER_ZONE || grovesFilled >= GROVES_PER_ZONE - 1;

  let remainingText: string;
  if (remainingZone <= 0) {
    remainingText = t('forest.zoneOpen');
  } else if (groveCurrent >= groveSize && towardZone) {
    remainingText = t('forest.remainingZone', { count: remainingZone });
  } else if (groveCurrent >= groveSize) {
    remainingText = t('forest.remainingDone');
  } else if (towardZone) {
    remainingText = t('forest.remainingZone', { count: remainingZone });
  } else {
    remainingText = t('forest.remaining', { count: remaining });
  }

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

      <div className={compact ? 'min-w-0' : 'min-w-0 sm:w-80'}>
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium text-ink ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {t('forest.groveProgress', {
              grove: groveNumber,
              current: Math.round(groveCurrent),
              total: groveSize,
            })}
          </p>
        </div>
        <div className={compact ? 'mt-1.5' : 'mt-2'}>
          <MilestoneTrack
            grovesFilled={grovesFilled}
            groveNumber={groveNumber}
            groveCurrent={groveCurrent}
            groveSize={groveSize}
            completedZones={completedZones}
            celebrateGrove={celebrateGrove}
            celebrateZone={celebrateZone}
            compact={compact}
          />
        </div>
        <div
          className={`overflow-hidden rounded-full bg-line/60 ${compact ? 'mt-1.5 h-1.5' : 'mt-2 h-2'}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={groveSize}
          aria-valuenow={Math.round(groveCurrent)}
        >
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
        </div>
        <p className={`text-muted ${compact ? 'mt-1 text-[11px]' : 'mt-2 text-xs'}`}>{remainingText}</p>
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
