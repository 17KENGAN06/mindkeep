import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { AppIcon } from '../../components/AppIcon';
import { AppButton } from '../../components/ui';
import { useTheme } from '../theme/useTheme';
import { GoogleSignInCancelledError, GoogleSignInNeedsAppError, requestGoogleSignInCode } from './googleSignIn';
import { mapAuthError } from './mapAuthError';
import { useAuth } from './useAuth';

function MethodRow({
  icon,
  title,
  status,
  on,
  children,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  on: boolean;
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
      >
        {hasGoogle ? (
          <AppButton
            variant="secondary"
            label={t('auth.methods.disconnect')}
            loading={busy}
            disabled={!hasPassword}
            onPress={() => void onDisconnect()}
          />
        ) : (
          <AppButton
            label={busy ? t('auth.methods.connecting') : t('auth.methods.connect')}
            loading={busy}
            onPress={() => void onConnect()}
          />
        )}
        {hasGoogle && !hasPassword ? (
          <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.methods.disconnectNeedsPassword')}</Text>
        ) : null}
      </MethodRow>

      {notice ? <Text style={[styles.notice, { color: colors.brand }]}>{notice}</Text> : null}
      {error ? <Text style={[styles.notice, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, gap: 12, marginTop: 20, padding: 16 },
  title: { fontSize: 17, fontWeight: '700' },
  lead: { fontSize: 13, lineHeight: 18 },
  row: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 12 },
  rowHead: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowStatus: { fontSize: 13, marginTop: 2 },
  rowStatusOn: { fontWeight: '700' },
  hint: { fontSize: 12 },
  notice: { fontSize: 14, fontWeight: '600' },
});
