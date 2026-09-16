import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../features/theme/useTheme';

type Tone = 'brand' | 'danger' | 'warn' | 'neutral';

export function Badge({ tone, label }: { tone: Tone; label: string }) {
  const { colors } = useTheme();
  const toneBg: Record<Tone, string> = {
    brand: `${colors.brand}29`,
    danger: `${colors.danger}29`,
    warn: `${colors.warn}29`,
    neutral: `${colors.muted}29`,
  };
  const toneFg: Record<Tone, string> = {
    brand: colors.brand,
    danger: colors.danger,
    warn: colors.warn,
    neutral: colors.muted,
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
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: ButtonProps) {
  const { colors } = useTheme();
  const busy = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' && { backgroundColor: colors.brand },
        variant === 'secondary' && {
          backgroundColor: colors.panel,
          borderColor: colors.line,
          borderWidth: 1,
        },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'danger' && { backgroundColor: `${colors.danger}29` },
        busy && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onBrand : colors.ink} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && { color: colors.onBrand },
            variant === 'danger' && { color: colors.danger },
            (variant === 'secondary' || variant === 'ghost') && { color: colors.ink },
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
  disabled: { opacity: 0.6 },
  buttonText: { fontSize: 15, fontWeight: '700' },
});
