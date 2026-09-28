import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { mapAuthError } from '@/features/auth/mapAuthError';
import { useAuth } from '@/features/auth/useAuth';
import type { AuthDevice } from '@/types/auth';

export function AccountPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasPassword = user?.hasPassword !== false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t('auth.accountTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('auth.accountSubtitle')}</p>
        {user ? <p className="mt-2 text-sm text-ink">{user.email}</p> : null}
      </div>

      <form
        className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5"
        onSubmit={(event) => void onSubmit(event)}
      >
        <h2 className="text-base font-semibold text-ink">
          {hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
        </h2>
        {!hasPassword ? <p className="text-sm text-muted">{t('auth.setPasswordHint')}</p> : null}
        {hasPassword ? (
          <Input
            label={t('auth.currentPassword')}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        ) : null}
        <Input
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={t('auth.passwordHint')}
        />
        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <ErrorMessage message={error ?? undefined} />
        {done ? <p className="text-sm text-brand-700">{t('auth.passwordChanged')}</p> : null}
        <Button type="submit" isLoading={busy}>
          {hasPassword ? t('auth.changePassword') : t('auth.setPassword')}
        </Button>
      </form>

      <DeviceList />
    </section>
  );
}

function DeviceList() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => (await authApi.sessions()).sessions,
  });

  const onRevoke = async (session: AuthDevice) => {
    setError(null);
    setBusyId(session.id);
    try {
      await authApi.revokeSession(session.id);
      if (session.current) {
        await logout();
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } catch (caught) {
      setError(mapAuthError(caught, t));
    } finally {
      setBusyId(null);
    }
  };

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{t('auth.devicesTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.devicesSubtitle')}</p>
      </div>
      <ErrorMessage message={error ?? undefined} />
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                {session.kind === 'native' ? t('auth.deviceApp') : t('auth.deviceBrowser')}
                {session.current ? ` · ${t('auth.deviceThis')}` : ''}
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(session.createdAt).toLocaleString(i18n.language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              isLoading={busyId === session.id}
              onClick={() => void onRevoke(session)}
            >
              {t('auth.deviceRevoke')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
