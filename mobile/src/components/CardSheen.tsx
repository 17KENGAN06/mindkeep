import { StyleSheet, View } from 'react-native';
import { useTheme } from '../features/theme/useTheme';

type CardSheenProps = {
  /** Kept for existing callers; the site's cards have no brand light, so it is ignored. */
  glow?: number;
  /** Corner radius of the card, so the top highlight follows the rounded corners. */
  radius?: number;
};

/**
 * The site's card edge (.glass-panel: inset 0 1px 0 var(--app-card-edge)): a 1 px highlight
 * along the top of the card, nothing else. Place it as the first child of a card with
 * overflow: 'hidden'.
 */
export function CardSheen({ radius = 16 }: CardSheenProps) {
  const { theme } = useTheme();
  // --app-card-edge: rgb(255 255 255 / 0.05) dark, rgb(255 255 255 / 0.9) light.
  const edge = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)';
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: radius, borderTopWidth: 1, borderColor: 'transparent', borderTopColor: edge },
      ]}
    />
  );
}
