import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { detectDeviceTimezone } from '../config/timezones';
import { mapAuthError } from '../features/auth/mapAuthError';
import { useAuth } from '../features/auth/useAuth';
import { useTheme } from '../features/theme/useTheme';
import { useTranslation } from 'react-i18next';

type AppleSignInButtonProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
};

/**
 * Sign in with Apple — iPhone only (App Store guideline 4.8, since Google sign-in is offered).
 * Uses Apple's own button; the server verifies the identity token.
 */
export function AppleSignInButton({ disabled = false, onError }: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { appleLogin } = useAuth();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void AppleAuthentication.isAvailableAsync().then((value) => {
      if (alive) setAvailable(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (Platform.OS !== 'ios' || !available) return null;

  const onPress = async () => {
    if (disabled || busy) return;
    onError(null);
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        onError(t('auth.errors.appleUnavailable'));
        return;
      }
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      await appleLogin({
        identityToken: credential.identityToken,
        ...(credential.authorizationCode ? { authorizationCode: credential.authorizationCode } : {}),
        ...(fullName ? { fullName } : {}),
        timezone: detectDeviceTimezone(),
      });
    } catch (caught) {
      const code = (caught as { code?: string } | null)?.code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      onError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, (disabled || busy) && styles.disabled]} pointerEvents={disabled || busy ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          theme === 'dark'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={14}
        style={styles.button}
        onPress={() => void onPress()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  disabled: { opacity: 0.6 },
  button: { height: 48, width: '100%' },
});
