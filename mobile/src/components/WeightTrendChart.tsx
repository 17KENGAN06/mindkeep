import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { WeightDay } from '../types/nutrition';
import { formatDate, formatMonthShort } from '../utils/date';

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
  let min = Math.floor((minValue - 2) / 10) * 10;
  let max = Math.ceil((maxValue + 2) / 10) * 10;
  if (max <= min) max = min + 20;
  const ticks: number[] = [];
  for (let value = max; value >= min; value -= 10) ticks.push(value);
  return { min, max, ticks };
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
  const { colors } = useTheme();
  const [chartWidth, setChartWidth] = useState(320);
  const [range, setRange] = useState<WeightTrendRange>(1);
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
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

  const values = sorted.map((point) => point.kg);
  if (goalKg != null) values.push(goalKg);
  const scale = niceScale(values.length ? Math.min(...values) : 70, values.length ? Math.max(...values) : 90);

  const chartHeight = 168;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 22;
  const padBottom = 24;
  const innerWidth = Math.max(chartWidth - padLeft - padRight, 1);
  const innerHeight = chartHeight - padTop - padBottom;

  const toX = (date: string) => {
    const ratio = (utcDay(date) - bounds.rangeStart) / Math.max(bounds.rangeEnd - bounds.rangeStart, 1);
    return padLeft + Math.min(1, Math.max(0, ratio)) * innerWidth;
  };
  const toY = (kg: number) => padTop + ((scale.max - kg) / (scale.max - scale.min)) * innerHeight;

  const coords = sorted.map((point) => ({ ...point, x: toX(point.date), y: toY(point.kg) }));

  return (
    <View style={styles.wrap}>
      <View style={styles.rangeHead}>
        <Text style={[styles.rangeLabel, { color: colors.muted }]}>{t('fuel.weightRange')}</Text>
        <View style={[styles.rangeRow, { backgroundColor: `${colors.brand}14`, borderColor: colors.line }]}>
          {WEIGHT_TREND_RANGES.map((value) => {
            const selectedRange = value === range;
            return (
              <Pressable
                key={value}
                onPress={() => setRange(value)}
                style={[styles.rangeBtn, selectedRange && { backgroundColor: colors.brand }]}
              >
                <Text style={[styles.rangeText, { color: selectedRange ? colors.onBrand : colors.muted }]}>
                  {t(`fuel.weightRange${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={[styles.empty, { borderColor: colors.line }]}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t('fuel.weightChartEmpty')}</Text>
        </View>
      ) : (
        <>
          <View
            style={[styles.chart, { height: chartHeight }]}
            onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
          >
            {scale.ticks.map((tick) => {
              const y = toY(tick);
              return (
                <View key={tick} pointerEvents="none" style={[styles.gridRow, { top: y }]}>
                  <Text style={[styles.axis, { color: colors.muted }]}>{tick}</Text>
                  <View style={[styles.gridLine, { backgroundColor: colors.line }]} />
                </View>
              );
            })}
            {axis.map((item) => (
              <Text
                key={item.date}
                style={[
                  styles.month,
                  {
                    color: colors.muted,
                    left: toX(item.date) - 16,
                  },
                ]}
              >
                {item.label}
              </Text>
            ))}
            {coords.slice(1).map((point, index) => {
              const from = coords[index];
              if (!from) return null;
              const dx = point.x - from.x;
              const dy = point.y - from.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={`line-${point.date}`}
                  pointerEvents="none"
                  style={[
                    styles.segment,
                    {
                      left: (from.x + point.x) / 2 - length / 2,
                      top: (from.y + point.y) / 2 - 1.5,
                      width: length,
                      backgroundColor: colors.brand,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
            {coords.map((point) => {
              const isActive = point.date === selected?.date;
              return (
                <Pressable
                  key={point.date}
                  onPress={() => onSelectDate(point.date)}
                  style={[styles.dotHit, { left: point.x - 16, top: point.y - 16 }]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive ? colors.bg : colors.brand,
                        borderColor: colors.brand,
                        borderWidth: isActive ? 3 : 0,
                        width: isActive ? 12 : 8,
                        height: isActive ? 12 : 8,
                        borderRadius: 6,
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
          {selected ? (
            <View style={styles.caption}>
              <Text style={[styles.captionValue, { color: colors.ink }]}>
                {formatKg(selected.kg)} {t('fuel.kg')}
              </Text>
              <Text style={[styles.captionDate, { color: colors.muted }]}>
                {formatDate(selected.date, language)}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  rangeHead: { gap: 8 },
  rangeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  rangeRow: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  rangeBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  rangeText: { fontSize: 14, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 140,
    paddingHorizontal: 16,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  chart: { overflow: 'visible', width: '100%' },
  gridRow: {
    alignItems: 'center',
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  axis: { fontSize: 11, width: 28 },
  gridLine: { flex: 1, height: 1, opacity: 0.7 },
  month: { bottom: 0, fontSize: 11, position: 'absolute', textAlign: 'center', width: 32 },
  segment: { height: 3, position: 'absolute' },
  dotHit: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
  },
  dot: {},
  caption: { alignItems: 'center' },
  captionValue: { fontSize: 16, fontWeight: '700' },
  captionDate: { fontSize: 13, marginTop: 2 },
});
