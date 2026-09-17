import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { detectDeviceTimezone } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import {
  GoogleSignInCancelledError,
  requestGoogleIdToken,
} from '../features/auth/googleSignIn';
import { useAuth } from '../features/auth/useAuth';
import { AppIcon } from '../components/AppIcon';
import { useTheme } from '../features/theme/useTheme';

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
};

export function GoogleSignInButton({ disabled = false, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { googleLogin } = useAuth();
  const [busy, setBusy] = useState(false);
  const blocked = disabled || busy;

  const onPress = async () => {
    onError(null);
    setBusy(true);
    try {
      const credential = await requestGoogleIdToken();
      await googleLogin({ credential, timezone: detectDeviceTimezone() });
    } catch (caught) {
      if (caught instanceof GoogleSignInCancelledError) return;
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('auth.continueWithGoogle')}
        disabled={blocked}
        onPress={() => void onPress()}
        style={[
          styles.button,
          { backgroundColor: colors.panel, borderColor: colors.line },
          blocked && styles.buttonDisabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <View style={styles.buttonInner}>
            <AppIcon name="logo-google" color={colors.ink} size={18} />
            <Text style={[styles.buttonText, { color: colors.ink }]}>{t('auth.continueWithGoogle')}</Text>
          </View>
        )}
      </Pressable>
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
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  buttonInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
