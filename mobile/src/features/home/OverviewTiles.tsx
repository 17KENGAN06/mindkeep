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
  /** Value is a placeholder ("no expenses yet"): shown quieter. */
  muted?: boolean;
  onPress: () => void;
};

/** "Overview": one small tile per section with its headline number; collapsible and remembered. */
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
                    <AppIcon name={tile.icon} color={colors.brand} size={15} />
                    <Text style={[styles.label, { color: colors.muted }]} numberOfLines={1}>
                      {tile.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.value,
                      { color: tile.muted ? colors.muted : colors.ink },
                      tile.muted && styles.valueMuted,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {tile.value}
                  </Text>
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
    flexBasis: '30%',
    flexGrow: 1,
    gap: 8,
    minHeight: 82,
    overflow: 'hidden',
    padding: 12,
  },
  tileHead: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  label: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12 },
  value: { fontFamily: fonts.display, fontSize: 16, letterSpacing: -0.3 },
  valueMuted: { fontFamily: fonts.medium, fontSize: 13 },
});
