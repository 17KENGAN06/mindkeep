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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginScreenProps = {
  onGoRegister: () => void;
};

export function LoginScreen({ onGoRegister }: LoginScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('auth.errors.email'));
      return;
    }
    if (!password) {
      setError(t('auth.errors.required'));
      return;
    }

    setBusy(true);
    try {
      await login({ email: email.trim(), password });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LanguageSwitcher />
        <Text style={[styles.brand, { color: colors.brand }]}>{t('common.appName')}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{t('auth.loginTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('auth.loginSubtitle')}</Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.email')}</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.password')}</Text>
        <TextInput
          autoComplete="password"
          secureTextEntry
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void onSubmit()}
          style={[styles.button, { backgroundColor: colors.brand }, busy && styles.buttonDisabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onBrand} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onBrand }]}>{t('auth.submitLogin')}</Text>
          )}
        </Pressable>

        <GoogleSignInButton disabled={busy} onError={setError} />

        <Pressable onPress={onGoRegister} style={styles.linkWrap}>
          <Text style={[styles.link, { color: colors.brand }]}>
            {t('auth.noAccount')} {t('auth.submitRegister')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 20 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 8, marginBottom: 28 },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { marginBottom: 16 },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14 },
});
