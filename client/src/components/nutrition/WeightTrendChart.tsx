import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@/i18n';
import type { WeightDay } from '@/types/nutrition';
import { formatChartDate, formatMonthShort } from '@/utils/date';

export const WEIGHT_TREND_RANGES = [1, 3, 6, 12] as const;
export type WeightTrendRange = (typeof WEIGHT_TREND_RANGES)[number];

type WeightTrendChartProps = {
  points: WeightDay[];
  selectedDate: string;
  year: number;
  month: number;
  goalKg?: number | null;
  onSelectDate: (date: string) => void;
};

function formatKg(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function niceScale(minValue: number, maxValue: number): { min: number; max: number; ticks: number[] } {
  const paddedMin = minValue - 2;
  const paddedMax = maxValue + 2;
  let min = Math.floor(paddedMin / 10) * 10;
  let max = Math.ceil(paddedMax / 10) * 10;
  if (max <= min) max = min + 20;
  const ticks: number[] = [];
  for (let value = max; value >= min; value -= 10) ticks.push(value);
  return { min, max, ticks };
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    if (!previous || !current) continue;
    const midX = (previous.x + current.x) / 2;
    d += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  return d;
}

function utcDay(date: string): number {
  return Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
}

function rangeBounds(year: number, month: number, monthsCount: WeightTrendRange) {
  const rangeStart = Date.UTC(year, month - monthsCount, 1);
  const rangeEnd = Date.UTC(year, month, 1);
  const start = new Date(rangeStart);
  const endExclusive = new Date(rangeEnd);
  return {
    rangeStart,
    rangeEnd,
    startKey: dateKey(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()),
    endKey: dateKey(endExclusive.getUTCFullYear(), endExclusive.getUTCMonth() + 1, endExclusive.getUTCDate()),
    months: Array.from({ length: monthsCount }, (_, index) => {
      const date = new Date(year, month - monthsCount + index, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    }),
  };
}

function dayLabels(year: number, month: number): Array<{ date: string; label: string }> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [1, 8, 15, 22].filter((day) => day <= daysInMonth);
  if (daysInMonth > 22) days.push(daysInMonth);
  return days.map((day) => ({ date: dateKey(year, month, day), label: String(day) }));
}

export function WeightTrendChart({
  points,
  selectedDate,
  year,
  month,
  goalKg,
  onSelectDate,
}: WeightTrendChartProps) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const [range, setRange] = useState<WeightTrendRange>(1);
  const bounds = rangeBounds(year, month, range);

  const sorted = useMemo(
    () =>
      [...points]
        .filter((point) => point.date >= bounds.startKey && point.date < bounds.endKey)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bounds.endKey, bounds.startKey, points],
  );

  const selected =
    sorted.find((point) => point.date === selectedDate) ?? sorted[sorted.length - 1] ?? null;

  const axis =
    range === 1
      ? dayLabels(year, month)
      : bounds.months
          .filter((_, index) => range < 12 || index % 2 === 0)
          .map((item) => ({
            date: dateKey(item.year, item.month, 1),
            label: formatMonthShort(item.year, item.month, language),
          }));

  const width = 680;
  const height = 240;
  const padLeft = 42;
  const padRight = 20;
  const padTop = 28;
  const padBottom = 32;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const values = sorted.map((point) => point.kg);
  if (goalKg != null) values.push(goalKg);
  const scale = niceScale(values.length ? Math.min(...values) : 70, values.length ? Math.max(...values) : 90);

  const toX = (date: string) => {
    const ratio = (utcDay(date) - bounds.rangeStart) / Math.max(bounds.rangeEnd - bounds.rangeStart, 1);
    return padLeft + Math.min(1, Math.max(0, ratio)) * innerWidth;
  };
  const toY = (kg: number) => padTop + ((scale.max - kg) / (scale.max - scale.min)) * innerHeight;

  const coords = sorted.map((point) => ({ ...point, x: toX(point.date), y: toY(point.kg) }));
  const line = smoothPath(coords);
  const active = coords.find((point) => point.date === selected?.date) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{t('calories.weightRange')}</p>
        <div
          className="grid min-w-0 flex-1 grid-cols-4 gap-1 rounded-2xl bg-brand-50/50 p-1 ring-1 ring-line sm:max-w-xs sm:flex-none"
          role="tablist"
          aria-label={t('calories.weightRange')}
        >
          {WEIGHT_TREND_RANGES.map((value) => {
            const selectedRange = value === range;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selectedRange}
                onClick={() => setRange(value)}
                className={`min-h-9 rounded-xl px-2 text-sm font-semibold transition ${
                  selectedRange ? 'bg-brand-500 text-[#07110d] shadow-sm' : 'text-muted hover:bg-panel hover:text-ink'
                }`}
              >
                {t(`calories.weightRange${value}`)}
              </button>
            );
          })}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-line px-4 text-center text-sm text-muted">
          {t('calories.weightChartEmpty')}
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full overflow-visible"
          role="img"
          aria-label={t('calories.weightChartTitle')}
        >
          {scale.ticks.map((tick) => {
            const y = toY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="var(--app-line)"
                  strokeOpacity="0.7"
                />
                <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="var(--app-muted)" fontSize="12">
                  {tick}
                </text>
              </g>
            );
          })}
          {axis.map((item) => (
            <text
              key={item.date}
              x={toX(item.date)}
              y={height - 8}
              textAnchor="middle"
              fill="var(--app-muted)"
              fontSize="12"
            >
              {item.label}
            </text>
          ))}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke="var(--app-brand-500)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {coords.map((point) => {
            const isActive = point.date === active?.date;
            return (
              <g key={point.date}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? 'var(--app-surface)' : 'var(--app-brand-500)'}
                  stroke="var(--app-brand-500)"
                  strokeWidth={isActive ? 3 : 0}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => onSelectDate(point.date)}
                >
                  <title>
                    {formatKg(point.kg)} {t('calories.kg')}
                  </title>
                </circle>
              </g>
            );
          })}
          {active ? (
            <g>
              <text
                x={active.x}
                y={Math.max(14, active.y - 22)}
                textAnchor="middle"
                fill="var(--app-ink)"
                fontSize="13"
                fontWeight="700"
              >
                {formatKg(active.kg)} {t('calories.kg')}
              </text>
              <text
                x={active.x}
                y={Math.max(28, active.y - 6)}
                textAnchor="middle"
                fill="var(--app-muted)"
                fontSize="11"
              >
                {formatChartDate(active.date, language)}
              </text>
            </g>
          ) : null}
        </svg>
      )}
    </div>
  );
}
