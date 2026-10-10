import { Platform, type ViewStyle } from 'react-native';

type GlowOptions = {
  /** Downward offset of the light, px. */
  y?: number;
  /** Blur radius, px. */
  blur?: number;
  /** 0–1. */
  opacity?: number;
  /** Negative pulls the light in under the element (Android box-shadow spread). */
  spread?: number;
};

function withAlpha(hex: string, opacity: number): string {
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${alpha}`;
}

/**
 * Soft coloured light under an element. iOS draws its shadow in the given colour; Android's
 * elevation shadow is always grey-black, so there a real coloured box-shadow is used instead
 * (New Architecture). Same look on both phones.
 */
export function glow(
  color: string,
  { y = 8, blur = 16, opacity = 0.32, spread = -4 }: GlowOptions = {},
): ViewStyle {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
    };
  }
  return {
    elevation: 0,
    boxShadow: `0px ${y}px ${blur}px ${spread}px ${withAlpha(color, opacity)}`,
  };
}
