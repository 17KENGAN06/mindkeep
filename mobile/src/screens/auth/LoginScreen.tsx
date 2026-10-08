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
import { BrandMark } from '../../components/BrandMark';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { issueBotToken } from '../../features/auth/botChallenge';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginScreenProps = {
  onGoRegister: () => void;
  onGoForgot: () => void;
};

export function LoginScreen({ onGoRegister, onGoForgot }: LoginScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { login, confirmLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locale = i18n.resolvedLanguage ?? i18n.language;

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
      const botToken = await issueBotToken();
      await login({
        email: email.trim(),
        password,
        locale,
        botToken,
        website: '',
      });
      setPendingEmail(email.trim());
      setCode('');
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!pendingEmail) return;
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('auth.errors.invalidLoginCode'));
      return;
    }
    setBusy(true);
    try {
      await confirmLogin({ email: pendingEmail, code: code.trim() });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setBusy(true);
    try {
      const botToken = await issueBotToken();
      await login({
        email: pendingEmail ?? email.trim(),
        password,
        locale,
        botToken,
        website: '',
      });
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
        <BrandMark size={64} style={styles.mark} />
        <Text style={[styles.brand, { color: colors.brand }]}>{t('common.appName')}</Text>

        {pendingEmail ? (
          <>
            <Text style={[styles.title, { color: colors.ink }]}>{t('auth.loginCodeTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t('auth.loginCodeSubtitle', { email: pendingEmail })}
            </Text>

            <Text style={[styles.label, { color: colors.muted }]}>{t('auth.loginCodeLabel')}</Text>
            <TextInput
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={6}
              style={[
                styles.input,
                { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
              ]}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            />

            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void onConfirm()}
              style={[styles.button, { backgroundColor: colors.brand }, busy && styles.buttonDisabled]}
            >
              {busy ? (
                <ActivityIndicator color={colors.onBrand} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onBrand }]}>
                  {t('auth.submitLoginCode')}
                </Text>
              )}
            </Pressable>

            <Pressable disabled={busy} onPress={() => void onResend()} style={styles.linkWrap}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('auth.resendLoginCode')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setPendingEmail(null);
                setCode('');
                setError(null);
              }}
              style={styles.linkWrap}
            >
              <Text style={[styles.link, { color: colors.brand }]}>{t('auth.backToLogin')}</Text>
            </Pressable>
          </>
        ) : (
          <>
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
            <AppleSignInButton disabled={busy} onError={setError} />

            <Pressable onPress={onGoForgot} style={styles.linkWrap}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            <Pressable onPress={onGoRegister} style={styles.linkWrap}>
              <Text style={[styles.link, { color: colors.brand }]}>
                {t('auth.noAccount')} {t('auth.submitRegister')}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  mark: { marginBottom: 16, marginTop: 12 },
  brand: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
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
