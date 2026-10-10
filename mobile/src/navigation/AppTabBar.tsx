import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useId } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { fonts } from '../config/fonts';
import { useTheme } from '../features/theme/useTheme';
import { glow } from '../utils/glow';

const TAB_ICONS: Record<string, AppIconName> = {
  Today: 'home-outline',
  More: 'layers-outline',
};
// Filled names render the same Lucide icon with a heavier stroke (see AppIcon).
const TAB_ICONS_ACTIVE: Record<string, AppIconName> = {
  Today: 'home',
  More: 'layers',
};

const ADD_SIZE = 56;

type AppTabBarProps = BottomTabBarProps & {
  onAdd: () => void;
  /** Unread notifications, shown on Sections. */
  badge?: string | number;
};

/** Quick-add button: dark glass with a thin brand ring and a soft glow, not a bright disc. */
function AddButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.add,
        { backgroundColor: pressed ? `${colors.brand}26` : colors.panel },
        glow(colors.brand, { y: 6, blur: 20, opacity: 0.4, spread: -4 }),
        pressed && styles.addPressed,
      ]}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={ADD_SIZE} height={ADD_SIZE}>
        <Defs>
          <LinearGradient id={`ring${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={0.95} />
            <Stop offset="0.55" stopColor={colors.brand} stopOpacity={0.25} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={0.6} />
          </LinearGradient>
          <LinearGradient id={`fill${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={0.04} />
          </LinearGradient>
        </Defs>
        <Circle cx={ADD_SIZE / 2} cy={ADD_SIZE / 2} r={ADD_SIZE / 2 - 1} fill={`url(#fill${id})`} />
        <Circle
          cx={ADD_SIZE / 2}
          cy={ADD_SIZE / 2}
          r={ADD_SIZE / 2 - 1}
          fill="none"
          stroke={`url(#ring${id})`}
          strokeWidth={1.5}
        />
      </Svg>
      <AppIcon name="add" color={colors.brand} size={26} />
    </Pressable>
  );
}

/**
 * Bottom bar: a floating frosted pill. The active tab is told apart by a brand icon and a
 * glowing dot; the "+" in the middle opens quick add.
 */
export function AppTabBar({ state, descriptors, navigation, onAdd, badge }: AppTabBarProps) {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dark = theme === 'dark';

  return (
    // Transparent: the page light (AmbientGlow under the tabs) shows around the floating pill.
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.bar,
          { borderColor: dark ? 'rgba(255,255,255,0.08)' : colors.line, shadowColor: '#000' },
        ]}
      >
        {/* Clipped separately: the bar itself must not clip the raised "+". */}
        <View pointerEvents="none" style={styles.glass}>
          {Platform.OS === 'ios' ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              intensity={60}
              tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
            />
          ) : null}
          <View
            style={[
              StyleSheet.absoluteFill,
              // iOS: a light veil over real blur; Android: a near-solid panel.
              { backgroundColor: `${colors.panel}${Platform.OS === 'ios' ? 'a6' : 'f2'}` },
            ]}
          />
        </View>

        {state.routes.map((route, index) => {
          if (route.name === 'Add') {
            return (
              <View key={route.key} style={styles.addSlot}>
                <AddButton onPress={onAdd} label={t('quickAdd.title')} />
              </View>
            );
          }

          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          const showBadge = route.name === 'More' && badge !== undefined;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.tab}
            >
              {({ pressed }) => (
                <View style={[styles.item, pressed && styles.itemPressed]}>
                  <View>
                    <AppIcon
                      name={(focused ? TAB_ICONS_ACTIVE : TAB_ICONS)[route.name] ?? 'layers-outline'}
                      color={focused ? colors.brand : colors.muted}
                      size={22}
                    />
                    {showBadge ? (
                      <View style={[styles.badge, { backgroundColor: `${colors.danger}e6`, borderColor: colors.panel }]}>
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.label, { color: focused ? colors.ink : colors.muted }, focused && styles.labelActive]}
                  >
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      focused
                        ? [
                            { backgroundColor: colors.brand },
                            glow(colors.brand, { y: 0, blur: 6, opacity: 0.9, spread: 0 }),
                          ]
                        : { backgroundColor: 'transparent' },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    elevation: 12,
    flexDirection: 'row',
    height: 68,
    paddingHorizontal: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  glass: { borderRadius: 29, bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  item: { alignItems: 'center', gap: 3, justifyContent: 'center', minWidth: 72, paddingTop: 6 },
  itemPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  label: { fontFamily: fonts.medium, fontSize: 11.5, letterSpacing: 0.2 },
  labelActive: { fontFamily: fonts.semibold },
  dot: { borderRadius: 999, height: 4, marginTop: 2, width: 4 },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -9,
    top: -6,
  },
  badgeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 9.5 },
  addSlot: { alignItems: 'center', width: 76 },
  add: {
    alignItems: 'center',
    borderRadius: ADD_SIZE / 2,
    height: ADD_SIZE,
    justifyContent: 'center',
    marginTop: -18,
    width: ADD_SIZE,
  },
  addPressed: { transform: [{ scale: 0.94 }] },
});
