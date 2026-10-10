import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../../components/AppIcon';
import { CardSheen } from '../../components/CardSheen';
import { fonts } from '../../config/fonts';
import { useTheme } from '../theme/useTheme';

const OPEN_KEY = 'mk_home_overview_open';
const TILE_RADIUS = 18;

export type OverviewTile = {
  key: string;
  icon: AppIconName;
  label: string;
  value: string;
  /** Small line under the number that says what it counts and over which period. */
  caption?: string;
  /** 0–1: thin bar under the number (share of the week's tasks done). */
  progress?: number;
  /** Nothing to count yet: the number is shown quieter. */
  muted?: boolean;
  onPress: () => void;
};

/**
 * "Summary": one tile per enabled section, two per row — section name, one big number and a
 * caption with its period. Collapsible; the choice is remembered.
 */
export function OverviewTiles({ tiles }: { tiles: OverviewTile[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(OPEN_KEY)
      .then((stored) => {
        if (stored === 'false') setOpen(false);
      })
      .catch(() => undefined);
  }, []);

  if (tiles.length === 0) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(240, 'easeInEaseOut', 'opacity'));
    setOpen((value) => {
      void AsyncStorage.setItem(OPEN_KEY, String(!value)).catch(() => undefined);
      return !value;
    });
  };

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        hitSlop={6}
        style={styles.head}
      >
        <Text style={[styles.eyebrow, { color: colors.muted }]}>
          {t('todayHub.overview.title')}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.line }]} />
        <View style={open ? styles.chevronUp : undefined}>
          <AppIcon name="chevron-down" color={colors.muted} size={16} />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityLabel={`${tile.label}: ${tile.value}`}
              onPress={tile.onPress}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: colors.panel },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              {({ pressed }) => (
                <>
                  <CardSheen glow={pressed ? 0.3 : 0.12} radius={TILE_RADIUS} />
                  <View style={styles.tileHead}>
                    <View style={[styles.iconChip, { backgroundColor: `${colors.brand}1f` }]}>
                      <AppIcon name={tile.icon} color={colors.brand} size={15} />
                    </View>
                    <Text style={[styles.label, { color: colors.ink }]} numberOfLines={1}>
                      {tile.label}
                    </Text>
                  </View>
                  <Text
                    style={[styles.value, { color: tile.muted ? colors.muted : colors.ink }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {tile.value}
                  </Text>
                  {tile.progress !== undefined ? (
                    <View style={[styles.track, { backgroundColor: colors.line }]}>
                      <View
                        style={[
                          styles.bar,
                          {
                            backgroundColor: colors.brand,
                            width: `${Math.round(Math.max(0, Math.min(1, tile.progress)) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                  {tile.caption ? (
                    <Text style={[styles.caption, { color: colors.muted }]} numberOfLines={2}>
                      {tile.caption}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, marginBottom: 14 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 2 },
  eyebrow: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    borderRadius: TILE_RADIUS,
    flexBasis: '45%',
    flexGrow: 1,
    gap: 6,
    minHeight: 112,
    overflow: 'hidden',
    padding: 14,
  },
  tileHead: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 2 },
  iconChip: {
    alignItems: 'center',
    borderRadius: 9,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  label: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13.5 },
  value: { fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.5 },
  track: { borderRadius: 999, height: 4, overflow: 'hidden' },
  bar: { borderRadius: 999, height: 4 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
});
