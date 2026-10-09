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
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={Platform.OS === 'ios' ? 50 : 60}
        tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        blurTarget={target}
        // Real blur on Android 12+; older versions get the tinted layer below only.
        blurMethod="dimezisBlurViewSdk31Plus"
      />
      {/* Brand-tinted veil: keeps text readable and the glass in the app's colours. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.bg}${dark ? '8c' : '99'}` }]} />
      <View style={[styles.hairline, { backgroundColor: colors.line }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hairline: { bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: 'absolute', right: 0 },
});
