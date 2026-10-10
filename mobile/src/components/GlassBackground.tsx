import type { RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../features/theme/useTheme';

type GlassBackgroundProps = {
  /**
   * Android blurs only what is inside this BlurTargetView (the scrolling content);
   * iOS blurs whatever is behind on its own.
   */
  target: RefObject<View | null>;
};

/**
 * Frosted-glass fill for floating headers: the content scrolling underneath shows through,
 * softly blurred and dimmed, with a hairline at the bottom. Place it as the header's first child.
 */
export function GlassBackground({ target }: GlassBackgroundProps) {
  const { colors, theme } = useTheme();
  const dark = theme === 'dark';
  const ios = Platform.OS === 'ios';
  // Android: a plain tint instead of the near-opaque "systemChrome" one, and a denser veil (~85%),
  // because real blur is missing in Expo Go and before Android 12 — with a thin veil the text
  // underneath read as if it overlapped the header. Content is only hinted at, never legible.
  const veil = ios ? (dark ? '8c' : '99') : dark ? 'd9' : 'e0';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={ios ? 50 : 35}
        tint={
          ios ? (dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight') : dark ? 'dark' : 'light'
        }
        blurTarget={target}
        // Real blur on Android 12+; older versions get the tinted layer below only.
        blurMethod="dimezisBlurViewSdk31Plus"
      />
      {/* Brand-tinted veil: keeps text readable and the glass in the app's colours. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.bg}${veil}` }]} />
      <View style={[styles.hairline, { backgroundColor: colors.line }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hairline: { bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: 'absolute', right: 0 },
});
