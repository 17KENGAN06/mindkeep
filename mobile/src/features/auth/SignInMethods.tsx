import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { AppIcon } from '../../components/AppIcon';
import { AppButton } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import { GoogleSignInCancelledError, GoogleSignInNeedsAppError, requestGoogleSignInCode } from './googleSignIn';
import { mapAuthError } from './mapAuthError';
import { useAuth } from './useAuth';
import { fonts } from '../../config/fonts';

function MethodRow({
  icon,
  title,
  status,
  on,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  on: boolean;
  /** Compact button at the right end of the row. */
  action?: ReactNode;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <View style={styles.rowHead}>
        <View style={[styles.icon, { backgroundColor: `${colors.brand}22` }]}>{icon}</View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: colors.ink }]}>{title}</Text>
          <Text style={[styles.rowStatus, { color: on ? colors.brand : colors.muted }, on && styles.rowStatusOn]}>
            {status}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

/**
 * Account → sign-in methods (same as the site): email + password and Google on one account.
 * Connecting Google opens the system browser like sign-in, so it needs the installed app.
 */
export function SignInMethods() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPassword = user?.hasPassword !== false;
  const hasGoogle = Boolean(user?.hasGoogle);
  const hasApple = Boolean(user?.hasApple);
  const [appleBusy, setAppleBusy] = useState(false);
  // Connecting Apple uses the iPhone's own sheet; elsewhere only the status and Disconnect show.
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void AppleAuthentication.isAvailableAsync().then((value) => {
      if (alive) setAppleAvailable(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onConnectApple = async () => {
    setError(null);
    setNotice(null);
    setAppleBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) {
        setError(t('auth.errors.appleUnavailable'));
        return;
      }
      const result = await authApi.linkApple({
        identityToken: credential.identityToken,
        ...(credential.authorizationCode ? { authorizationCode: credential.authorizationCode } : {}),
      });
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.appleConnected'));
    } catch (caught) {
      const code = (caught as { code?: string } | null)?.code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      setError(mapAuthError(caught, t));
    } finally {
      setAppleBusy(false);
    }
  };

  const onDisconnectApple = async () => {
    setError(null);
    setNotice(null);
    setAppleBusy(true);
    try {
      const result = await authApi.unlinkApple();
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.appleDisconnected'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setAppleBusy(false);
    }
  };

  const onConnect = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const { code, flowSecret } = await requestGoogleSignInCode();
      const result = await authApi.linkGoogle({ code, flowSecret });
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.connected'));
    } catch (caught) {
      if (caught instanceof GoogleSignInCancelledError) return;
      setError(caught instanceof GoogleSignInNeedsAppError ? t('auth.errors.googleNeedsApp') : mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await authApi.unlinkGoogle();
      queryClient.setQueryData(['auth', 'me'], result.user);
      setNotice(t('auth.methods.disconnected'));
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
      <Text style={[styles.title, { color: colors.ink }]}>{t('auth.methods.title')}</Text>
      <Text style={[styles.lead, { color: colors.muted }]}>{t('auth.methods.lead')}</Text>

      <MethodRow
        icon={<AppIcon name="key-outline" color={colors.brand} size={20} />}
        title={t('auth.methods.password')}
        status={hasPassword ? t('auth.methods.passwordOn') : t('auth.methods.passwordOff')}
        on={hasPassword}
      />

      <MethodRow
        icon={<AppIcon name="logo-google" color={colors.brand} size={20} />}
        title={t('auth.methods.google')}
        status={hasGoogle ? t('auth.methods.googleOn') : t('auth.methods.googleOff')}
        on={hasGoogle}
        action={
          hasGoogle ? (
            <AppButton
              size="small"
              variant="secondary"
              label={t('auth.methods.disconnect')}
              loading={busy}
              disabled={!hasPassword && !hasApple}
              onPress={() => void onDisconnect()}
            />
          ) : (
            <AppButton
              size="small"
              label={busy ? t('auth.methods.connecting') : t('auth.methods.connect')}
              loading={busy}
              onPress={() => void onConnect()}
            />
          )
        }
      >
        {hasGoogle && !hasPassword && !hasApple ? (
          <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.methods.disconnectNeedsPassword')}</Text>
        ) : null}
      </MethodRow>

      <MethodRow
        icon={<AppIcon name="logo-apple" color={colors.brand} size={20} />}
        title={t('auth.methods.apple')}
        status={hasApple ? t('auth.methods.googleOn') : t('auth.methods.googleOff')}
        on={hasApple}
        action={
          hasApple ? (
            <AppButton
              size="small"
              variant="secondary"
              label={t('auth.methods.disconnect')}
              loading={appleBusy}
              disabled={!hasPassword && !hasGoogle}
              onPress={() => void onDisconnectApple()}
            />
          ) : appleAvailable ? (
            <AppButton
              size="small"
              label={appleBusy ? t('auth.methods.connecting') : t('auth.methods.appleConnect')}
              loading={appleBusy}
              onPress={() => void onConnectApple()}
            />
          ) : null
        }
      >
        {hasApple && !hasPassword && !hasGoogle ? (
          <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.methods.disconnectNeedsOther')}</Text>
        ) : !hasApple && !appleAvailable ? (
          <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.methods.appleOnlyIphone')}</Text>
        ) : null}
      </MethodRow>

      {notice ? <Text style={[styles.notice, { color: colors.brand }]}>{notice}</Text> : null}
      {error ? <Text style={[styles.notice, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, gap: 12, marginTop: 20, padding: 16 },
  title: { fontSize: 17, fontFamily: fonts.bold },
  lead: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  row: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 12 },
  rowHead: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontFamily: fonts.bold },
  rowStatus: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  rowStatusOn: { fontFamily: fonts.bold },
  hint: { fontFamily: fonts.regular, fontSize: 12 },
  notice: { fontSize: 14, fontFamily: fonts.semibold },
});
