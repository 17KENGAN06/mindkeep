import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { AuthScreenFrame } from '../../components/AuthScreenFrame';
import { fonts } from '../../config/fonts';
import { issueBotToken } from '../../features/auth/botChallenge';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useTheme } from '../../features/theme/useTheme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ForgotPasswordScreenProps = {
  onGoLogin: () => void;
};

export function ForgotPasswordScreen({ onGoLogin }: ForgotPasswordScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('auth.errors.email'));
      return;
    }
    setBusy(true);
    try {
      const botToken = await issueBotToken();
      await authApi.forgotPassword({
        email: email.trim(),
        locale: i18n.resolvedLanguage ?? i18n.language,
        botToken,
        website: '',
      });
      setSent(true);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreenFrame>
          <Text style={[styles.title, { color: colors.ink }]}>{t('auth.forgotTitle')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {sent ? t('auth.forgotSent') : t('auth.forgotSubtitle')}
          </Text>
          {sent ? null : (
            <>
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
              {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
              <Pressable
                disabled={busy}
                onPress={() => void onSubmit()}
                style={[styles.button, { backgroundColor: colors.brand }, busy && styles.buttonDisabled]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onBrand} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.onBrand }]}>{t('auth.forgotSubmit')}</Text>
                )}
              </Pressable>
            </>
          )}
          <Pressable onPress={onGoLogin} style={styles.linkWrap}>
            <Text style={[styles.link, { color: colors.brand }]}>{t('auth.submitLogin')}</Text>
          </Pressable>
    </AuthScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 24, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 24 },
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
  button: { alignItems: 'center', borderRadius: 14, justifyContent: 'center', minHeight: 52 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  linkWrap: { marginTop: 18, alignItems: 'center' },
  link: { fontFamily: fonts.medium, fontSize: 14 },
});
