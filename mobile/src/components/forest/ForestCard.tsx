import { View, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  TREES_PER_GROVE,
  deriveForestProgress,
  groveNumberInZone,
  groveOrdinal,
  grovesFilledInZone,
  isGroveComplete,
  isZoneComplete,
  remainingToZone,
} from '../../features/forest/forestProgress';
import { useTheme } from '../../features/theme/useTheme';
import { ForestGrove } from './ForestGrove';
import { ForestStats } from './ForestStats';

type ForestBanner = 'grove-1' | 'grove-2' | 'grove-3' | 'zone' | 'new-grove' | 'new-zone' | null;

function currentBanner(totalCompleted: number): ForestBanner {
  if (totalCompleted <= 0) return null;
  if (isZoneComplete(totalCompleted)) return 'zone';
  if (isGroveComplete(totalCompleted)) {
    const ordinal = groveOrdinal(Math.floor(totalCompleted / TREES_PER_GROVE));
    if (ordinal === 1) return 'grove-1';
    if (ordinal === 2) return 'grove-2';
    if (ordinal === 3) return 'grove-3';
    return 'zone';
  }
  return null;
}

function bannerCopy(banner: ForestBanner): { title: string; hint: string } | null {
  if (banner === 'grove-1') return { title: 'forest.groveComplete1', hint: 'forest.groveHint1' };
  if (banner === 'grove-2') return { title: 'forest.groveComplete2', hint: 'forest.groveHint2' };
  if (banner === 'grove-3') return { title: 'forest.groveComplete3', hint: 'forest.groveHint3' };
  if (banner === 'zone') return { title: 'forest.zoneComplete', hint: 'forest.zoneHint' };
  if (banner === 'new-grove') return { title: 'forest.newGrove', hint: 'forest.newGroveHint' };
  if (banner === 'new-zone') return { title: 'forest.newZone', hint: 'forest.newZoneHint' };
  return null;
}

export function ForestCard({
  totalCompleted,
  completedToday,
  layout = 'compact',
  monthLabel,
  onExplore,
}: {
  totalCompleted: number;
  completedToday: number;
  layout?: 'compact' | 'expanded';
  monthLabel?: string;
  onExplore?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const snapshot = deriveForestProgress(totalCompleted);
  const banner = currentBanner(totalCompleted);
  const copy = bannerCopy(banner);
  const celebrateGrove = isGroveComplete(totalCompleted) ? groveNumberInZone(snapshot) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <ForestStats
        trees={snapshot.totalTrees}
        treesToday={completedToday}
        groveCurrent={snapshot.treesInGrove}
        groveSize={snapshot.groveSize}
        groveNumber={groveNumberInZone(snapshot)}
        grovesFilled={grovesFilledInZone(snapshot)}
        completedZones={snapshot.completedZones}
        remaining={snapshot.remainingToGrove}
        remainingZone={remainingToZone(snapshot)}
        plusOne={completedToday > 0}
        celebrateGrove={celebrateGrove}
        celebrateZone={isZoneComplete(totalCompleted)}
        onExplore={onExplore}
        monthLabel={monthLabel}
      />
      {copy ? (
        <View style={[styles.banner, { backgroundColor: `${colors.brand}1f`, borderColor: colors.brand }]}>
          <Text style={[styles.bannerTitle, { color: colors.ink }]}>{t(copy.title)}</Text>
          <Text style={[styles.bannerHint, { color: colors.muted }]}>{t(copy.hint)}</Text>
        </View>
      ) : null}
      <ForestGrove
        totalCompleted={totalCompleted}
        density={layout === 'expanded' ? 'page' : 'preview'}
        height={layout === 'expanded' ? 220 : 140}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerHint: { fontSize: 12 },
});
