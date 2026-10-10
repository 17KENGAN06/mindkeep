import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { detectDeviceTimezone } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import {
  GoogleSignInCancelledError,
  GoogleSignInNeedsAppError,
  requestGoogleSignInCode,
} from '../features/auth/googleSignIn';
import { useAuth } from '../features/auth/useAuth';
import { AppButton } from './ui';
import { useTheme } from '../features/theme/useTheme';
import { fonts } from '../config/fonts';

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
};

export function GoogleSignInButton({ disabled = false, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { googleLogin } = useAuth();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    onError(null);
    setBusy(true);
    try {
      const { code, flowSecret } = await requestGoogleSignInCode();
      await googleLogin({ code, flowSecret, timezone: detectDeviceTimezone() });
    } catch (caught) {
      if (caught instanceof GoogleSignInCancelledError) return;
      if (caught instanceof GoogleSignInNeedsAppError) {
        onError(t('auth.errors.googleNeedsApp'));
        return;
      }
      onError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.divider} accessibilityElementsHidden>
        <View style={[styles.line, { backgroundColor: colors.line }]} />
        <Text style={[styles.or, { color: colors.muted }]}>{t('auth.or')}</Text>
        <View style={[styles.line, { backgroundColor: colors.line }]} />
      </View>
      <AppButton
        size="large"
        variant="secondary"
        icon="logo-google"
        label={t('auth.continueWithGoogle')}
        loading={busy}
        disabled={disabled}
        onPress={() => void onPress()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1 },
  or: {
    fontFamily: fonts.regular,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
