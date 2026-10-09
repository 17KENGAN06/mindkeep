import { useId } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import { fonts } from '../config/fonts';

type Tone = 'brand' | 'danger' | 'warn' | 'neutral' | 'expense';

export function Badge({ tone, label }: { tone: Tone; label: string }) {
  const { colors } = useTheme();
  const toneBg: Record<Tone, string> = {
    brand: `${colors.brand}29`,
    danger: `${colors.danger}29`,
    warn: `${colors.warn}29`,
    neutral: `${colors.muted}29`,
    expense: `${colors.expense}29`,
  };
  const toneFg: Record<Tone, string> = {
    brand: colors.brand,
    danger: colors.danger,
    warn: colors.warn,
    neutral: colors.muted,
    expense: colors.expense,
  };

  return (
    <View style={[styles.badge, { backgroundColor: toneBg[tone] }]}>
      <Text style={[styles.badgeText, { color: toneFg[tone] }]}>{label}</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Optional icon before the label. */
  icon?: AppIconName;
};

const BUTTON_RADIUS = 16;

/** Brand gradient + soft top sheen behind the primary button (same language as the home cards). */
function PrimaryFill() {
  const { colors, theme } = useTheme();
  const id = useId().replace(/:/g, '');
  // Deeper end of the gradient: the site's brand-400 (dark) / brand-700 (light).
  const deep = theme === 'dark' ? '#5fc98e' : '#274e3e';
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id={`fill${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.brand} />
          <Stop offset="1" stopColor={deep} />
        </LinearGradient>
        <LinearGradient id={`shine${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.28} />
          <Stop offset="0.55" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#fill${id})`} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#shine${id})`} />
    </Svg>
  );
}

/**
 * The app's button. Primary: brand gradient with a soft glow; secondary: frosted glass with a
 * hairline; danger: red tint; ghost: text only. Presses shrink slightly.
 */
export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const busy = disabled || loading;
  const textColor =
    variant === 'primary' ? colors.onBrand : variant === 'danger' ? colors.danger : colors.ink;

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.brand },
        variant === 'secondary' && {
          backgroundColor: pressed ? `${colors.brand}14` : `${colors.panel}e6`,
          borderColor: pressed ? `${colors.brand}66` : colors.line,
          borderWidth: 1,
        },
        variant === 'ghost' && { backgroundColor: pressed ? `${colors.brand}12` : 'transparent' },
        variant === 'danger' && {
          backgroundColor: pressed ? `${colors.danger}33` : `${colors.danger}1f`,
          borderColor: `${colors.danger}55`,
          borderWidth: 1,
        },
        pressed && !busy && styles.pressed,
        busy && styles.disabled,
      ]}
    >
      {variant === 'primary' ? <PrimaryFill /> : null}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} color={textColor} size={18} /> : null}
          <Text style={[styles.buttonText, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (variant !== 'primary') return button;
  // iOS drops shadows on views that clip (the gradient needs overflow: hidden), so the soft
  // brand glow lives on a wrapper around the button.
  return (
    <View
      style={[
        styles.glow,
        { backgroundColor: colors.brand, shadowColor: colors.brand },
        busy && styles.glowOff,
      ]}
    >
      {button}
    </View>
  );
}

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: AppIconName;
  /** Colour for the selected state (default: brand); e.g. danger for "expense". */
  tone?: string;
  disabled?: boolean;
  /** Stretch across its container (e.g. one half of a two-way switch). */
  fill?: boolean;
};

/** Pill for picking one of a few options (filters, categories, tabs) — same look in every section. */
export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  tone,
  disabled = false,
  fill = false,
}: ChoiceChipProps) {
  const { colors } = useTheme();
  const accent = tone ?? colors.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        fill && styles.chipFill,
        selected
          ? { backgroundColor: `${accent}24`, borderColor: `${accent}8c` }
          : { backgroundColor: `${colors.panel}e6`, borderColor: colors.line },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <AppIcon name={icon} color={selected ? accent : colors.muted} size={15} /> : null}
      <Text
        style={[
          styles.chipText,
          { color: selected ? accent : colors.ink },
          selected && styles.chipTextSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontFamily: fonts.bold },
  button: {
    alignItems: 'center',
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    minHeight: 50,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  glow: {
    borderRadius: BUTTON_RADIUS,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  // Disabled: no glow and no solid wrapper showing through the dimmed button.
  glowOff: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  content: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  buttonText: { fontSize: 15.5, fontFamily: fonts.semibold, letterSpacing: 0.1 },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
  },
  chipFill: { alignSelf: 'stretch', justifyContent: 'center' },
  chipText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  chipTextSelected: { fontFamily: fonts.semibold },
});
