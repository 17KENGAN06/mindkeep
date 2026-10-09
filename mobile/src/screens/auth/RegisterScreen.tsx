import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthScreenFrame } from '../../components/AuthScreenFrame';
import { USER_NAME_MAX } from '../../utils/name';
import { fonts } from '../../config/fonts';
import { AppleSignInButton } from '../../components/AppleSignInButton';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { issueBotToken } from '../../features/auth/botChallenge';
import { useAuth } from '../../features/auth/useAuth';
import { detectDeviceTimezone } from '../../config/timezones';
import { useTheme } from '../../features/theme/useTheme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterScreenProps = {
  onGoLogin: () => void;
};

export function RegisterScreen({ onGoLogin }: RegisterScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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
      const botToken = await issueBotToken();
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        timezone: detectDeviceTimezone(),
        locale: i18n.resolvedLanguage ?? i18n.language,
        botToken,
        website: '',
      });
      setPendingEmail(email.trim());
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreenFrame>
        <Text style={[styles.title, { color: colors.ink }]}>{t('auth.registerTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('auth.registerSubtitle')}</Text>

        {pendingEmail ? (
          <>
            <Text style={[styles.pending, { color: colors.ink }]}>{t('auth.checkEmailTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t('auth.checkEmailBody', { email: pendingEmail })}
            </Text>
            <Pressable onPress={onGoLogin} style={styles.linkWrap}>
              <Text style={[styles.link, { color: colors.brand }]}>{t('auth.submitLogin')}</Text>
            </Pressable>
          </>
        ) : (
          <>
        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.name')}</Text>
        <TextInput
          autoComplete="name"
          maxLength={USER_NAME_MAX}
          style={[
            styles.input,
            { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
          ]}
          value={name}
          onChangeText={setName}
        />

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
          autoComplete="new-password"
          secureTextEntry
          style={[
            styles.input,
            { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
          ]}
          value={password}
          onChangeText={setPassword}
        />
        <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.passwordHint')}</Text>

        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.confirmPassword')}</Text>
        <TextInput
          autoComplete="new-password"
          secureTextEntry
          style={[
            styles.input,
            { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
          ]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Text style={[styles.hint, { color: colors.muted }]}>
          {t('auth.timezoneDetected', { timezone: detectDeviceTimezone() })}
        </Text>

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
            <Text style={[styles.buttonText, { color: colors.onBrand }]}>{t('auth.submitRegister')}</Text>
          )}
        </Pressable>


        <GoogleSignInButton disabled={busy} onError={setError} />
            <AppleSignInButton disabled={busy} onError={setError} />

        <Pressable onPress={onGoLogin} style={styles.linkWrap}>
          <Text style={[styles.link, { color: colors.brand }]}>
            {t('auth.hasAccount')} {t('auth.submitLogin')}
          </Text>
        </Pressable>
          </>
        )}
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 24, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 14, marginBottom: 8 },
  hint: { fontFamily: fonts.regular, fontSize: 12, marginTop: -8, marginBottom: 16 },
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
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  linkWrap: { marginTop: 18, alignItems: 'center' },
  link: { fontFamily: fonts.medium, fontSize: 14 },
  pending: { fontFamily: fonts.bold, fontSize: 18, marginTop: 12 },
});
