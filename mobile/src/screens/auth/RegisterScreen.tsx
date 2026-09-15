import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { detectDeviceTimezone } from '../../config/timezones';
import { colors } from '../../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterScreenProps = {
  onGoLogin: () => void;
};

export function RegisterScreen({ onGoLogin }: RegisterScreenProps) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('auth.errors.email'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }
    if (password.length > 72) {
      setError(t('auth.errors.passwordMax'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMatch'));
      return;
    }

    setBusy(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        timezone: detectDeviceTimezone(),
      });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>{t('common.appName')}</Text>
        <Text style={styles.title}>{t('auth.registerTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>

        <Text style={styles.label}>{t('auth.name')}</Text>
        <TextInput autoComplete="name" style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          autoComplete="new-password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.hint}>{t('auth.passwordHint')}</Text>

        <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
        <TextInput
          autoComplete="new-password"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Text style={styles.hint}>
          {t('auth.timezoneDetected', { timezone: detectDeviceTimezone() })}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void onSubmit()}
          style={[styles.button, busy && styles.buttonDisabled]}
        >
          {busy ? (
            <ActivityIndicator color="#07110d" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.submitRegister')}</Text>
          )}
        </Pressable>

        <Pressable onPress={onGoLogin} style={styles.linkWrap}>
          <Text style={styles.link}>
            {t('auth.hasAccount')} {t('auth.submitLogin')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  brand: { color: colors.brand, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 8, marginBottom: 28 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 12, marginTop: -8, marginBottom: 16 },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { color: colors.danger, marginBottom: 16 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#07110d', fontSize: 16, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { color: colors.brand, fontSize: 14 },
});
