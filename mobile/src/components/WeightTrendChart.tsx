import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../features/theme/useTheme';
import type { AppLanguage } from '../i18n';
import type { WeightDay } from '../types/nutrition';
import { formatDate, formatMonthShort } from '../utils/date';

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
  const language = (i18n.resolvedLanguage ?? 'en').slice(0, 2) as AppLanguage;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const selected =
    sorted.find((point) => point.date === selectedDate) ?? sorted[sorted.length - 1] ?? null;

  const months = [3, 2, 1, 0].map((offset) => {
    const date = new Date(year, month - 1 - offset, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });
  const firstMonth = months[0] ?? { year, month };
  const rangeStart = Date.UTC(firstMonth.year, firstMonth.month - 1, 1);
  const rangeEnd = Date.UTC(year, month, 1);

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
    const ratio = (utcDay(date) - rangeStart) / Math.max(rangeEnd - rangeStart, 1);
    return padLeft + Math.min(1, Math.max(0, ratio)) * innerWidth;
  };
  const toY = (kg: number) => padTop + ((scale.max - kg) / (scale.max - scale.min)) * innerHeight;

  const coords = sorted.map((point) => ({ ...point, x: toX(point.date), y: toY(point.kg) }));

  return (
    <View style={styles.wrap}>
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
            {months.map((item, index) => (
              <Text
                key={`${item.year}-${item.month}`}
                style={[
                  styles.month,
                  {
                    color: colors.muted,
                    left: padLeft + ((index + 0.5) / months.length) * innerWidth - 16,
                  },
                ]}
              >
                {formatMonthShort(item.year, item.month, language)}
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
