import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthScreenFrame } from '../../components/AuthScreenFrame';
import { AppButton } from '../../components/ui';
import { fonts } from '../../config/fonts';
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

  const onConfirm = async (value = code) => {
    if (!pendingEmail || busy) return;
    setError(null);
    if (!/^\d{6}$/.test(value.trim())) {
      setError(t('auth.errors.invalidLoginCode'));
      return;
    }
    setBusy(true);
    try {
      await confirmLogin({ email: pendingEmail, code: value.trim() });
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
    <AuthScreenFrame>
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
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
            value={code}
            returnKeyType="done"
            onSubmitEditing={() => void onConfirm()}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 6);
              setCode(next);
              // Sign in as soon as the sixth digit is in: the button can sit under the keyboard.
              if (next.length === 6) void onConfirm(next);
            }}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <AppButton
            size="large"
            label={t('auth.submitLoginCode')}
            loading={busy}
            onPress={() => void onConfirm()}
          />

          <View style={styles.links}>
            <AppButton
              variant="link"
              label={t('auth.resendLoginCode')}
              disabled={busy}
              onPress={() => void onResend()}
            />
            <AppButton
              variant="link"
              icon="chevron-back"
              label={t('auth.backToLogin')}
              onPress={() => {
                setPendingEmail(null);
                setCode('');
                setError(null);
              }}
            />
          </View>
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
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
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
              { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
            ]}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <AppButton
            size="large"
            label={t('auth.submitLogin')}
            loading={busy}
            onPress={() => void onSubmit()}
          />

          <GoogleSignInButton disabled={busy} onError={setError} />
          <AppleSignInButton disabled={busy} onError={setError} />

          <View style={styles.links}>
            <AppButton variant="link" label={t('auth.forgotPassword')} onPress={onGoForgot} />
            <AppButton
              variant="secondary"
              label={`${t('auth.noAccount')} ${t('auth.submitRegister')}`}
              onPress={onGoRegister}
            />
          </View>
        </>
      )}
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 24, letterSpacing: -0.3 },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 24,
  },
  label: { fontFamily: fonts.semibold, fontSize: 14, marginBottom: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { fontFamily: fonts.medium, marginBottom: 16 },
  links: { gap: 6, marginTop: 16 },
});
