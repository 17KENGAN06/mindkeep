import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GROVES_PER_ZONE } from '../../features/forest/forestProgress';
import { useTheme } from '../../features/theme/useTheme';

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
  onExplore?: () => void;
  monthLabel?: string;
};

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
  onExplore,
  monthLabel,
}: ForestStatsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const progress = groveSize > 0 ? Math.min(100, (groveCurrent / groveSize) * 100) : 0;
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
    <View style={styles.root}>
      <Text style={[styles.kicker, { color: colors.muted }]}>{t('forest.title')}</Text>
      {monthLabel ? <Text style={[styles.month, { color: colors.muted }]}>{monthLabel}</Text> : null}
      <View style={styles.treesRow}>
        <Text style={[styles.trees, { color: colors.ink }]}>{t('forest.trees', { count: trees })}</Text>
        {plusOne ? (
          <View style={[styles.plus, { backgroundColor: `${colors.brand}26` }]}>
            <Text style={[styles.plusText, { color: colors.brand }]}>{t('forest.plusOne')}</Text>
          </View>
        ) : null}
      </View>
      {treesToday > 0 ? (
        <Text style={[styles.today, { color: colors.brand }]}>
          {t('forest.addedToday', { count: treesToday })}
        </Text>
      ) : null}

      <Text style={[styles.grove, { color: colors.ink }]}>
        {t('forest.groveProgress', {
          grove: groveNumber,
          current: Math.round(groveCurrent),
          total: groveSize,
        })}
      </Text>

      <View style={styles.pips} accessibilityLabel={t('forest.pathLabel', { grove: groveNumber, zone: completedZones })}>
        {Array.from({ length: GROVES_PER_ZONE }, (_, index) => {
          const n = index + 1;
          const filled = n <= grovesFilled;
          const current = n === groveNumber && groveCurrent < groveSize;
          const celebrating = celebrateGrove === n;
          return (
            <View
              key={n}
              style={[
                styles.pip,
                { backgroundColor: colors.line },
                (filled || current) && { backgroundColor: colors.brand },
                current && !filled && { opacity: 0.4 },
                celebrating && { borderColor: colors.brand, borderWidth: 2 },
              ]}
            />
          );
        })}
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <View
          style={[
            styles.zonePip,
            { backgroundColor: colors.line },
            (completedZones > 0 || celebrateZone) && { backgroundColor: colors.brand },
          ]}
        />
        <Text style={[styles.zoneLabel, { color: completedZones > 0 ? colors.brand : colors.muted }]}>
          {completedZones > 0 ? t('forest.zonesCount', { count: completedZones }) : t('forest.zonePip')}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.line }]}>
        <View style={[styles.fill, { backgroundColor: colors.brand, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.remaining, { color: colors.muted }]}>{remainingText}</Text>
      {onExplore ? (
        <Pressable onPress={onExplore} style={styles.explore}>
          <Text style={[styles.exploreText, { color: colors.brand }]}>{t('forest.explore')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  kicker: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  month: { fontSize: 12 },
  treesRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trees: { fontSize: 22, fontWeight: '700' },
  plus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  plusText: { fontSize: 11, fontWeight: '700' },
  today: { fontSize: 12, fontWeight: '600' },
  grove: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  pips: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pip: { borderRadius: 999, height: 8, width: 8 },
  divider: { height: 12, width: 1 },
  zonePip: { height: 8, transform: [{ rotate: '45deg' }], width: 8 },
  zoneLabel: { fontSize: 11, fontWeight: '700' },
  track: { borderRadius: 999, height: 6, marginTop: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  remaining: { fontSize: 12 },
  explore: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 4 },
  exploreText: { fontSize: 14, fontWeight: '700' },
});
