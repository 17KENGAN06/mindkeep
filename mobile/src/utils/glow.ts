import type { ViewStyle } from 'react-native';

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

/**
 * Coloured light under an element. The app now follows the site's flat style (no brand glow
 * on buttons, tiles or glasses), so this returns no style; callers stay as they are and the
 * signature is kept in case a glow is wanted again.
 */
export function glow(_color: string, _options: GlowOptions = {}): ViewStyle {
  return {};
}
