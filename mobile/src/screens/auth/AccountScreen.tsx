import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SectionScrollView } from '../../components/SectionScrollView';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { InlineQueryError } from '../../components/QueryState';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { BillingCard } from '../../features/billing/BillingCard';
import { isProAccount } from '../../features/billing/planLimit';
import { useAuth } from '../../features/auth/useAuth';
import { SignInMethods } from '../../features/auth/SignInMethods';
import { useRefreshOnFocus } from '../../features/sync/useRefreshOnFocus';
import { useTheme } from '../../features/theme/useTheme';
import type { AuthDevice } from '../../types/auth';
import { fonts } from '../../config/fonts';

export function AccountScreen() {
  const { t, i18n } = useTranslation();
  useRefreshOnFocus('auth', 'billing');
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const hasPassword = user?.hasPassword !== false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => (await authApi.sessions()).sessions,
  });
  const sessions = sessionsQuery.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['billing'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } finally {
      setRefreshing(false);
    }
  };

  const onRevoke = async (session: AuthDevice) => {
    setDeviceError(null);
    setBusyId(session.id);
    try {
      await authApi.revokeSession(session.id);
      if (session.current) {
        await logout();
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } catch (caught) {
      setDeviceError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const runDelete = async () => {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await authApi.deleteAccount({
        ...(hasPassword ? { password: deletePassword } : {}),
        confirm: 'DELETE',
      });
      await logout();
    } catch (caught) {
      setDeleteError(mapAuthError(caught, t));
    } finally {
      setDeleteBusy(false);
    }
  };

  const onDelete = () => {
    setDeleteError(null);
    if (deleteConfirm !== 'DELETE') {
      setDeleteError(t('auth.deleteAccountTypeHint'));
      return;
    }
    Alert.alert(t('auth.deleteAccount'), t('auth.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.deleteAccount'),
        style: 'destructive',
        onPress: () => void runDelete(),
      },
    ]);
  };

  const onSubmit = async () => {
    setError(null);
    setDone(false);
    if (password.length < 8) {
      setError(t('auth.errors.passwordMin'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMatch'));
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.changePassword({
        ...(hasPassword ? { currentPassword } : {}),
        password,
        confirmPassword,
      });
      queryClient.setQueryData(['auth', 'me'], result.user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setDone(true);
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SectionScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.brand} />
        }
      >
        <Text style={[styles.lead, { color: colors.muted }]}>{t('auth.accountSubtitle')}</Text>
        {user ? <Text style={[styles.email, { color: colors.ink }]}>{user.email}</Text> : null}
        {user && isProAccount(user) ? (
          <Text style={[styles.plan, { color: colors.brand }]}>
            {t(user.plan === 'PLUS' ? 'billing.plusLabel' : 'billing.proLabel')}
          </Text>
        ) : null}
        <BillingCard />
        <SignInMethods />
        {/* Same gap as the other sections below; without it this block sat against the one above. */}
        <Text style={[styles.section, { color: colors.ink, marginTop: 28 }]}>
          {hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
        </Text>
        {!hasPassword ? (
          <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.setPasswordHint')}</Text>
        ) : null}
        {hasPassword ? (
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>{t('auth.currentPassword')}</Text>
            <TextInput
              secureTextEntry
              autoComplete="password"
              style={[
                styles.input,
                { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.newPassword')}</Text>
        <TextInput
          secureTextEntry
          autoComplete="new-password"
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={password}
          onChangeText={setPassword}
        />
        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.confirmPassword')}</Text>
        <TextInput
          secureTextEntry
          autoComplete="new-password"
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        {done ? <Text style={[styles.done, { color: colors.brand }]}>{t('auth.passwordChanged')}</Text> : null}
        <AppButton
          label={hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
          loading={busy}
          onPress={() => void onSubmit()}
        />
        <Text style={[styles.section, { color: colors.ink, marginTop: 28 }]}>
          {t('auth.devicesTitle')}
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.devicesSubtitle')}</Text>
        {deviceError ? <Text style={[styles.error, { color: colors.danger }]}>{deviceError}</Text> : null}
        {sessionsQuery.isError ? <InlineQueryError error={sessionsQuery.error} /> : null}
        {sessions.map((session) => (
          <View
            key={session.id}
            style={[styles.device, { backgroundColor: colors.panel, borderColor: colors.line }]}
          >
            <Text style={[styles.deviceTitle, { color: colors.ink }]}>
              {session.kind === 'native' ? t('auth.deviceApp') : t('auth.deviceBrowser')}
              {session.current ? ` · ${t('auth.deviceThis')}` : ''}
            </Text>
            <Text style={[styles.deviceMeta, { color: colors.muted }]}>
              {new Date(session.createdAt).toLocaleString(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
            <AppButton
              label={t('auth.deviceRevoke')}
              variant="secondary"
              loading={busyId === session.id}
              onPress={() => void onRevoke(session)}
            />
          </View>
        ))}
        <Text style={[styles.section, { color: colors.ink, marginTop: 28 }]}>
          {t('auth.deleteAccount')}
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{t('auth.deleteAccountHint')}</Text>
        {hasPassword ? (
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>{t('auth.currentPassword')}</Text>
            <TextInput
              secureTextEntry
              autoComplete="password"
              style={[
                styles.input,
                { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
              ]}
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
          </View>
        ) : null}
        <Text style={[styles.label, { color: colors.muted }]}>{t('auth.deleteAccountTypeLabel')}</Text>
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          style={[
            styles.input,
            { backgroundColor: colors.panel, borderColor: colors.line, color: colors.ink },
          ]}
          value={deleteConfirm}
          onChangeText={setDeleteConfirm}
        />
        {deleteError ? <Text style={[styles.error, { color: colors.danger }]}>{deleteError}</Text> : null}
        <AppButton
          label={t('auth.deleteAccount')}
          variant="danger"
          loading={deleteBusy}
          onPress={onDelete}
        />
      </SectionScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  lead: { fontFamily: fonts.regular, fontSize: 15, marginBottom: 8 },
  email: { fontSize: 16, fontFamily: fonts.semibold, marginBottom: 8 },
  plan: { fontSize: 14, fontFamily: fonts.bold, marginBottom: 16 },
  section: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 8 },
  hint: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 16 },
  label: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 6 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: { marginBottom: 16 },
  done: { marginBottom: 16, fontSize: 14, fontFamily: fonts.semibold },
  device: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    gap: 8,
  },
  deviceTitle: { fontSize: 15, fontFamily: fonts.bold },
  deviceMeta: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 8 },
});
