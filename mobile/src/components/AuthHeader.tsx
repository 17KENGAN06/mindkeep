import { useEffect, useRef, type RefObject } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from './BrandMark';
import { GlassBackground } from './GlassBackground';
import { LanguageSwitcher } from './LanguageSwitcher';
import { fonts } from '../config/fonts';
import { useTheme } from '../features/theme/useTheme';

/** Height of the header row; content below starts this far down. */
export const AUTH_HEADER_HEIGHT = 62;

type AuthHeaderProps = {
  /** Content scrolled under the header: fade in the frosted-glass background. */
  raised?: boolean;
  /** The scrolling content (a BlurTargetView), so Android can blur it. */
  blurTarget: RefObject<View | null>;
};

/**
 * Floating top row of the signed-out screens, like the site header: logo + "Mindkeep",
 * language on the right. Content scrolls underneath and shows through as frosted glass.
 */
export function AuthHeader({ raised = false, blurTarget }: AuthHeaderProps) {
  const { colors } = useTheme();
  // Absolute children ignore the SafeAreaView padding, so step below the status bar here;
  // the glass still reaches up behind the clock and battery.
  const insets = useSafeAreaInsets();
  const glass = useRef(new Animated.Value(raised ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glass, {
      toValue: raised ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [glass, raised]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glass }]}>
        <GlassBackground target={blurTarget} />
      </Animated.View>
      <View style={styles.row}>
        <View style={styles.brand}>
          <BrandMark size={34} />
          <Text style={[styles.name, { color: colors.ink }]}>Mindkeep</Text>
        </View>
        <LanguageSwitcher compact />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { left: 0, position: 'absolute', right: 0, top: 0, zIndex: 10 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: AUTH_HEADER_HEIGHT,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  name: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.3 },
});
