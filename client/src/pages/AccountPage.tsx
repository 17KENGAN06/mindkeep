import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { billingApi, type BillingStatus } from '@/api/billing';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

      <BillingSection />
      <DeviceList />
      <DeleteAccount hasPassword={hasPassword} />
    </section>
  );
}

const USAGE_KEYS = [
  'materials',
  'reviewCategories',
  'habits',
  'notes',
  'tasks',
  'financeOperations',
  'financeCategories',
  'sessions',
] as const;

function BillingSection() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'month' | 'year' | 'portal' | 'sync' | null>(null);

  const statusQuery = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => billingApi.status(),
  });

  useEffect(() => {
    const billing = searchParams.get('billing');
    const sessionId = searchParams.get('session_id');
    if (!billing) return;

    if (billing === 'canceled') {
      setNotice(t('billing.canceled'));
      setSearchParams({}, { replace: true });
      return;
    }

    if (billing === 'success' && sessionId) {
      setBusy('sync');
      void billingApi
        .sync(sessionId)
        .then((result) => {
          queryClient.setQueryData(['auth', 'me'], result.user);
          void queryClient.invalidateQueries({ queryKey: ['billing'] });
          setNotice(t('billing.success'));
        })
        .catch((caught) => {
          setError(mapAuthError(caught, t));
        })
        .finally(() => {
          setBusy(null);
          setSearchParams({}, { replace: true });
        });
      return;
    }

    setSearchParams({}, { replace: true });
  }, [queryClient, searchParams, setSearchParams, t]);

  const startCheckout = async (interval: 'month' | 'year') => {
    setError(null);
    setBusy(interval);
    try {
      const result = await billingApi.checkout(interval);
      window.location.assign(result.url);
    } catch (caught) {
      setError(mapAuthError(caught, t));
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    setBusy('portal');
    try {
      const result = await billingApi.portal();
      window.location.assign(result.url);
    } catch (caught) {
      setError(mapAuthError(caught, t));
      setBusy(null);
    }
  };

  const status = statusQuery.data;
  const isPro = status?.plan === 'PRO';
  const expires = status?.planExpiresAt
    ? new Date(status.planExpiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
    : null;

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{t('billing.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('billing.subtitle')}</p>
      </div>
      {notice ? <p className="text-sm text-brand-700">{notice}</p> : null}
      <ErrorMessage message={error ?? undefined} />
      {statusQuery.isError ? <ErrorMessage message={t('auth.errors.generic')} /> : null}

      {status ? (
        <p className="text-sm text-ink">
          {isPro ? t('billing.proLabel') : t('billing.freeLabel')}
          {expires
            ? ` · ${t(status.cancelAtPeriodEnd ? 'billing.ends' : 'billing.renews', { date: expires })}`
            : ''}
        </p>
      ) : null}

      {status?.cancelAtPeriodEnd ? (
        <p className="text-sm text-muted">{t('billing.cancelScheduled')}</p>
      ) : null}

      {status && !status.configured ? (
        <p className="text-sm text-muted">{t('billing.unavailable')}</p>
      ) : null}

      {status?.configured && !isPro ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            isLoading={busy === 'month'}
            disabled={busy !== null}
            onClick={() => void startCheckout('month')}
          >
            {t('billing.subscribeMonth')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            isLoading={busy === 'year'}
            disabled={busy !== null}
            onClick={() => void startCheckout('year')}
          >
            {t('billing.subscribeYear')}
          </Button>
        </div>
      ) : null}

      {status?.configured && !isPro ? (
        <p className="text-sm text-muted">{t('billing.yearlyHint')}</p>
      ) : null}

      {status?.configured && isPro ? (
        <Button
          type="button"
          variant="secondary"
          isLoading={busy === 'portal'}
          disabled={busy !== null}
          onClick={() => void openPortal()}
        >
          {t('billing.manage')}
        </Button>
      ) : null}

      {status && !isPro ? (
        <UsageList usage={status.usage} />
      ) : null}
    </div>
  );
}

function UsageList({ usage }: { usage: BillingStatus['usage'] }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-1 text-sm text-muted">
      {USAGE_KEYS.map((key) => {
        const item = usage[key];
        const count =
          item.limit == null ? t('billing.unlimited') : t('billing.of', { used: item.used, limit: item.limit });
        return (
          <li key={key}>
            {t(`billing.features.${key}`)}: {count}
          </li>
        );
      })}
      <li>{t('billing.mealsHint')}</li>
    </ul>
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

function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    setError(null);
    if (confirm !== 'DELETE') {
      setError(t('auth.deleteAccountTypeHint'));
      return;
    }
    setBusy(true);
    try {
      await authApi.deleteAccount({
        ...(hasPassword ? { password } : {}),
        confirm: 'DELETE',
      });
      await logout();
    } catch (caught) {
      setError(mapAuthError(caught, t));
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-line bg-panel/80 p-5">
      <div>
        <h2 className="text-base font-semibold text-ink">{t('auth.deleteAccount')}</h2>
        <p className="mt-1 text-sm text-muted">{t('auth.deleteAccountHint')}</p>
      </div>
      {hasPassword ? (
        <Input
          label={t('auth.currentPassword')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      ) : null}
      <Input
        label={t('auth.deleteAccountTypeLabel')}
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        hint={t('auth.deleteAccountTypeHint')}
      />
      <ErrorMessage message={error ?? undefined} />
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {t('auth.deleteAccount')}
      </Button>
      <ConfirmDialog
        open={open}
        title={t('auth.deleteAccount')}
        description={t('auth.deleteAccountConfirm')}
        confirmLabel={t('auth.deleteAccount')}
        cancelLabel={t('common.cancel')}
        isLoading={busy}
        onConfirm={() => void onDelete()}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
