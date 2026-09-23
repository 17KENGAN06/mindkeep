import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '@/i18n';
import type { WeightDay } from '@/types/nutrition';
import { formatChartDate, formatMonthShort } from '@/utils/date';

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
  const sorted = useMemo(
    () => [...points].sort((a, b) => a.date.localeCompare(b.date)),
    [points],
  );

  const selected =
    sorted.find((point) => point.date === selectedDate) ?? sorted[sorted.length - 1] ?? null;

  const months = [3, 2, 1, 0].map((offset) => {
    const date = new Date(year, month - 1 - offset, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });

  const rangeStart = Date.UTC(months[0]!.year, months[0]!.month - 1, 1);
  const rangeEnd = Date.UTC(year, month, 1);

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
    const ratio = (utcDay(date) - rangeStart) / Math.max(rangeEnd - rangeStart, 1);
    return padLeft + Math.min(1, Math.max(0, ratio)) * innerWidth;
  };
  const toY = (kg: number) => padTop + ((scale.max - kg) / (scale.max - scale.min)) * innerHeight;

  const coords = sorted.map((point) => ({ ...point, x: toX(point.date), y: toY(point.kg) }));
  const line = smoothPath(coords);
  const active = coords.find((point) => point.date === selected?.date) ?? null;

  return (
    <div>
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
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--app-muted)"
                  fontSize="12"
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {months.map((item, index) => {
            const x = padLeft + ((index + 0.5) / months.length) * innerWidth;
            return (
              <text
                key={`${item.year}-${item.month}`}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--app-muted)"
                fontSize="12"
              >
                {formatMonthShort(item.year, item.month, language)}
              </text>
            );
          })}
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
