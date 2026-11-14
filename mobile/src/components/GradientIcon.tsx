import { StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';

type GradientIconProps = {
  name: AppIconName;
  /** Plate size; the icon is about half of it. */
  size?: number;
};

/**
 * An icon on a soft brand tile, like the site's icon tiles (bg-accent-soft + text-accent):
 * flat, no gradient or glow. The name is kept so existing screens need no change.
 */
export function GradientIcon({ name, size = 48 }: GradientIconProps) {
  const { colors, theme } = useTheme();
  const radius = Math.round(size * 0.28);
  // The site's --app-accent-soft: brand at 16 % (dark) / 10 % (light).
  const soft = `${colors.brand}${theme === 'dark' ? '29' : '1a'}`;
  return (
    <View style={[styles.plate, { width: size, height: size, borderRadius: radius, backgroundColor: soft }]}>
      <AppIcon name={name} color={colors.brand} size={Math.round(size * 0.48)} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
