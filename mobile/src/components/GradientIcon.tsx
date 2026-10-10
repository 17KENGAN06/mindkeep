import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import { glow } from '../utils/glow';

type GradientIconProps = {
  name: AppIconName;
  /** Plate size; the icon is about half of it. */
  size?: number;
};

/** An icon on a brand-gradient plate with a soft top highlight, like a small app icon. */
export function GradientIcon({ name, size = 48 }: GradientIconProps) {
  const { colors, theme } = useTheme();
  const id = useId().replace(/:/g, '');
  const radius = Math.round(size * 0.33);
  // Darker end of the gradient: the site's brand-300 (dark) / brand-700 (light).
  const deep = theme === 'dark' ? '#3f7a5a' : '#274e3e';
  return (
    <View
      style={[
        styles.plate,
        { width: size, height: size, borderRadius: radius, backgroundColor: deep },
        glow(colors.brand, { y: 4, blur: 14, opacity: 0.4, spread: -3 }),
      ]}
    >
      <Svg style={StyleSheet.absoluteFill} width={size} height={size}>
        <Defs>
          <LinearGradient id={`plate${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={deep} />
          </LinearGradient>
          <LinearGradient id={`shine${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={radius} fill={`url(#plate${id})`} />
        <Rect width={size} height={size} rx={radius} fill={`url(#shine${id})`} />
      </Svg>
      <AppIcon name={name} color={colors.onBrand} size={Math.round(size * 0.48)} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
