import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

/** Same as the site's Button: rounded-xl (12 px). */
const BUTTON_RADIUS = 12;

/**
 * The app's button, drawn like the site's Button (client/src/components/ui/Button.tsx).
 * Primary: flat brand fill. Secondary: panel with a hairline ring. Danger: red tint.
 * Ghost / link: text only. Presses shrink slightly.
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
  const busy = disabled || loading;
  const textColor =
    variant === 'primary'
      ? colors.onBrand
      : variant === 'danger'
        ? colors.danger
        : variant === 'link'
          ? colors.brand
          : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonSize === 'large' && styles.buttonLarge,
        buttonSize === 'small' && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: pressed ? `${colors.brand}d9` : colors.brand },
        variant === 'secondary' && {
          backgroundColor: pressed ? `${colors.brand}14` : colors.panel,
          borderWidth: 1,
          borderColor: pressed ? colors.brand : colors.line,
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
