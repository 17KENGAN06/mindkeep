import { useId, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppIcon, type AppIconName } from './AppIcon';
import { useTheme } from '../features/theme/useTheme';
import { fonts } from '../config/fonts';
import { glow } from '../utils/glow';

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
  /** link: brand-coloured text action ("Forgot password?", "Back to sign in"). */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  /** Optional icon before the label. */
  icon?: AppIconName;
  /** Optional icon after the label (e.g. an arrow on "Get started"). */
  trailingIcon?: AppIconName;
  /** Large: the main call to action of a screen (welcome, sign-in, onboarding). */
  /** small: an action inside a row ("Disconnect" next to Google). */
  size?: 'small' | 'regular' | 'large';
};

const BUTTON_RADIUS = 16;

type Size = { width: number; height: number };

/**
 * Painted surface of a button, drawn at the measured size with its own rounded corners —
 * percentage-sized SVGs kept their first layout width on iOS and left a bare strip on the right.
 * Primary: brand gradient, glass sheen on the top half, bright top edge and a darker lower lip.
 * Secondary: frosted glass with a hairline that is bright on top and fades out below.
 */
function ButtonSurface({ size, variant }: { size: Size; variant: 'primary' | 'secondary' }) {
  const { colors, theme } = useTheme();
  const id = useId().replace(/:/g, '');
  const dark = theme === 'dark';
  const { width, height } = size;
  const r = Math.min(BUTTON_RADIUS, height / 2);

  if (variant === 'secondary') {
    // Same language as the bar's "+": dark glass with a brand tint inside and a glowing ring
    // that is brightest at the top-left corner.
    return (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id={`tint${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={dark ? 0.16 : 0.12} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={dark ? 0.03 : 0.02} />
          </LinearGradient>
          <LinearGradient id={`sheen${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={dark ? 0.08 : 0.45} />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`ring${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={0.9} />
            <Stop offset="0.5" stopColor={colors.brand} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} rx={r} fill={`url(#tint${id})`} />
        <Rect x={0} y={0} width={width} height={height} rx={r} fill={`url(#sheen${id})`} />
        <Rect
          x={1.25}
          y={1.25}
          width={width - 2.5}
          height={height - 2.5}
          rx={r - 1.25}
          fill="none"
          stroke={`url(#ring${id})`}
          strokeWidth={1.5}
        />
      </Svg>
    );
  }

  // Ends of the gradient: a lit top-left and the site's brand-400 (dark) / brand-700 (light).
  const lit = dark ? '#b4f7cf' : '#4a8a70';
  const deep = dark ? '#4fbf83' : '#244a3a';
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <LinearGradient id={`fill${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={lit} />
          <Stop offset="0.45" stopColor={colors.brand} />
          <Stop offset="1" stopColor={deep} />
        </LinearGradient>
        <LinearGradient id={`shine${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={dark ? 0.34 : 0.22} />
          <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.04} />
          <Stop offset="0.51" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`rim${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.7} />
          <Stop offset="0.35" stopColor="#ffffff" stopOpacity={0.08} />
          <Stop offset="0.75" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={dark ? 0.22 : 0.3} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={r} fill={`url(#fill${id})`} />
      <Rect x={0} y={0} width={width} height={height} rx={r} fill={`url(#shine${id})`} />
      <Rect
        x={1.25}
        y={1.25}
        width={width - 2.5}
        height={height - 2.5}
        rx={r - 1.25}
        fill="none"
        stroke={`url(#rim${id})`}
        strokeWidth={1.5}
      />
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
  trailingIcon,
  size: buttonSize = 'regular',
}: ButtonProps) {
  const { colors } = useTheme();
  const [size, setSize] = useState<Size | null>(null);
  const busy = disabled || loading;
  const textColor =
    variant === 'primary'
      ? colors.onBrand
      : variant === 'danger'
        ? colors.danger
        : variant === 'link'
          ? colors.brand
          : colors.ink;
  const painted = variant === 'primary' || variant === 'secondary';

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
      disabled={busy}
      onPress={onPress}
      onLayout={
        painted
          ? (event) => {
              // Whole pixels: a fractional size let the ring's bottom edge fall outside the clip.
              const width = Math.floor(event.nativeEvent.layout.width);
              const height = Math.floor(event.nativeEvent.layout.height);
              setSize((prev) =>
                prev && prev.width === width && prev.height === height ? prev : { width, height },
              );
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.button,
        buttonSize === 'large' && styles.buttonLarge,
        buttonSize === 'small' && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: colors.brand },
        variant === 'secondary' && {
          backgroundColor: pressed ? `${colors.brand}26` : colors.panel,
        },
        variant === 'ghost' && { backgroundColor: pressed ? `${colors.brand}12` : 'transparent' },
        variant === 'link' && [
          styles.link,
          { backgroundColor: pressed ? `${colors.brand}14` : 'transparent' },
        ],
        variant === 'danger' && {
          backgroundColor: pressed ? `${colors.danger}33` : `${colors.danger}1f`,
          borderColor: `${colors.danger}55`,
          borderWidth: 1,
        },
        pressed && !busy && styles.pressed,
        busy && styles.disabled,
      ]}
    >
      {painted && size ? <ButtonSurface size={size} variant={variant} /> : null}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <AppIcon
              name={icon}
              color={
                variant === 'secondary' && !icon.startsWith('logo-') ? colors.brand : textColor
              }
              size={18}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              buttonSize === 'large' && styles.buttonTextLarge,
              buttonSize === 'small' && styles.buttonTextSmall,
              { color: textColor },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {trailingIcon ? <AppIcon name={trailingIcon} color={textColor} size={18} /> : null}
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
        busy
          ? styles.glowOff
          : [
              { backgroundColor: colors.brand },
              glow(colors.brand, { y: 8, blur: 22, opacity: 0.38, spread: -6 }),
            ],
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
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  // No extra Android font padding: the label sits in the middle of the pill on both platforms.
  badgeText: { fontSize: 13, fontFamily: fonts.bold, includeFontPadding: false, lineHeight: 17 },
  button: {
    alignItems: 'center',
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    minHeight: 50,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  glow: { borderRadius: BUTTON_RADIUS },
  // Disabled: no glow and no solid wrapper showing through the dimmed button.
  glowOff: { backgroundColor: 'transparent' },
  content: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
  buttonLarge: { minHeight: 56 },
  buttonSmall: { minHeight: 38, paddingHorizontal: 14, paddingVertical: 6 },
  buttonTextSmall: { fontSize: 13.5 },
  link: { minHeight: 44, paddingVertical: 8 },
  buttonTextLarge: { fontSize: 16.5 },
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
