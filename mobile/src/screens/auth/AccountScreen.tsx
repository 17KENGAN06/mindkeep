import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth';
import { AppButton } from '../../components/ui';
import { mapAuthError } from '../../features/auth/mapAuthError';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';

export function AccountScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasPassword = user?.hasPassword !== false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.lead, { color: colors.muted }]}>{t('auth.accountSubtitle')}</Text>
        {user ? <Text style={[styles.email, { color: colors.ink }]}>{user.email}</Text> : null}
        <Text style={[styles.section, { color: colors.ink }]}>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  lead: { fontSize: 15, marginBottom: 8 },
  email: { fontSize: 16, fontWeight: '600', marginBottom: 24 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 13, marginBottom: 16 },
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
  done: { marginBottom: 16, fontSize: 14, fontWeight: '600' },
});
