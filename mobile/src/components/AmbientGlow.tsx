import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import glow from '../../assets/brand/glow.png';
import { useTheme } from '../features/theme/useTheme';

/**
 * The website's AmbientBackdrop: soft brand-coloured light behind the content.
 * One white radial PNG, tinted and stretched into three orbs.
 */
export function AmbientGlow() {
  const { colors, theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const span = Math.max(width, height);
  // Same strength as the site's --app-accent-soft / --app-orb-* tokens.
  const strength = theme === 'dark' ? [0.24, 0.18, 0.14] : [0.12, 0.09, 0.07];

  const orbs = [
    { size: span * 0.9, top: -span * 0.32, left: -span * 0.3, opacity: strength[0] },
    { size: span * 0.7, top: height * 0.28, left: width - span * 0.38, opacity: strength[1] },
    { size: span * 0.8, top: height - span * 0.35, left: width * 0.05 - span * 0.2, opacity: strength[2] },
  ];

  return (
    <View pointerEvents="none" style={styles.fill}>
      {orbs.map((orb, index) => (
        <Image
          key={index}
          source={glow}
          style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            opacity: orb.opacity,
            tintColor: colors.brand,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
});
