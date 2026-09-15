import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Tone = 'brand' | 'danger' | 'warn' | 'neutral';

const toneBg: Record<Tone, string> = {
  brand: 'rgba(142, 239, 180, 0.16)',
  danger: 'rgba(248, 113, 113, 0.16)',
  warn: 'rgba(251, 191, 36, 0.16)',
  neutral: 'rgba(138, 163, 150, 0.16)',
};

const toneFg: Record<Tone, string> = {
  brand: colors.brand,
  danger: colors.danger,
  warn: colors.warn,
  neutral: colors.muted,
};

export function Badge({ tone, label }: { tone: Tone; label: string }) {
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
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: ButtonProps) {
  const busy = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        busy && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#07110d' : colors.ink} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryText,
            variant === 'danger' && styles.dangerText,
            (variant === 'secondary' || variant === 'ghost') && styles.secondaryText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1 },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(248, 113, 113, 0.16)' },
  disabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  primaryText: { color: '#07110d' },
  secondaryText: { color: colors.ink },
  dangerText: { color: colors.danger },
});
