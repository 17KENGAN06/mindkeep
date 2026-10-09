import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../features/theme/useTheme';

type CardSheenProps = {
  /** Strength of the brand light in the top-left corner (0–1). */
  glow?: number;
  /** Corner radius of the card: draws a hairline border that is bright on top and fades out below. */
  radius?: number;
};

/**
 * Background for premium cards: brand light from the top-left corner plus a faint glass sheen
 * along the top edge. Place it as the first child of a card with overflow: 'hidden'.
 */
export function CardSheen({ glow = 0.22, radius }: CardSheenProps) {
  const { colors, theme } = useTheme();
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const dark = theme === 'dark';
  const sheen = dark ? 0.06 : 0.5;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => setSize(event.nativeEvent.layout)}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`glow${id}`} cx="0%" cy="0%" rx="90%" ry="90%" fx="0%" fy="0%">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={glow} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`sheen${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={sheen} />
            <Stop offset="0.45" stopColor="#ffffff" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`edge${id}`} x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={dark ? '#ffffff' : colors.brand} stopOpacity={dark ? 0.22 : 0.35} />
            <Stop offset="0.6" stopColor={colors.brand} stopOpacity={0.05} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#glow${id})`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#sheen${id})`} />
        {radius !== undefined && size ? (
          <Rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={radius - 0.5}
            fill="none"
            stroke={`url(#edge${id})`}
            strokeWidth={1}
          />
        ) : null}
      </Svg>
    </View>
  );
}
