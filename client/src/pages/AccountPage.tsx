import { ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="mx-auto w-full max-w-4xl space-y-6">
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
  const { user } = useAuth();
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
  const billed = Boolean(status?.hasStripeCustomer);
  const subscribed = Boolean(status?.subscribed);
  const isAdmin = user?.role === 'ADMIN';
  const isBeta = Boolean((user?.betaTester || status?.betaTester) && !isAdmin);
  const isPro = status?.plan === 'PRO';
  const showSubscribe = Boolean(status?.configured && !subscribed && !isBeta);
  const showManage = Boolean(status?.configured && billed);
  const expires = status?.planExpiresAt
    ? new Date(status.planExpiresAt).toLocaleDateString(i18n.language, { dateStyle: 'medium' })
    : null;

  const planName = isAdmin
    ? t('billing.adminUnlimited')
    : subscribed
      ? t('billing.proLabel')
      : isBeta
        ? t('billing.betaLabel')
        : t('billing.freeLabel');
  const planCaption =
    subscribed && expires
      ? t(status?.cancelAtPeriodEnd ? 'billing.ends' : 'billing.renews', { date: expires })
      : isBeta
        ? t('billing.betaHint')
        : t('billing.subtitle');

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-brand-500/35 bg-panel shadow-[0_18px_40px_-28px_rgba(53,111,88,0.55)] ring-1 ring-brand-500/10">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-500/25 via-brand-50/80 to-panel px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-brand-500 uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t('billing.title')}
            </p>
            {showSubscribe ? (
              <>
                <div className="mt-3 flex items-end gap-2">
                  <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                    {t('home.pricing.yearPerMonth')}
                  </p>
                  <p className="mb-1.5 text-sm font-medium text-muted">{t('home.pricing.perMonth')}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-brand-500">
                  {t('home.pricing.onlyIfYearly')}
                </p>
                <p className="mt-1 text-sm text-muted">{t('home.pricing.yearCharged')}</p>
                <p className="mt-1 text-xs text-muted">{t('home.pricing.yearHint')}</p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{planCaption}</p>
              </>
            ) : (
              <>
                <p className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {status ? planName : '…'}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{planCaption}</p>
              </>
            )}
          </div>
          {status ? (
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                isPro ? 'bg-brand-500 text-[#07110d]' : 'bg-panel/90 text-ink ring-1 ring-line'
              }`}
            >
              {planName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
        {notice ? (
          <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{notice}</p>
        ) : null}
        <ErrorMessage message={error ?? undefined} />
        {statusQuery.isError ? <ErrorMessage message={t('auth.errors.generic')} /> : null}

        {status?.cancelAtPeriodEnd ? (
          <p className="rounded-2xl bg-brand-50/80 px-4 py-3 text-sm text-ink">{t('billing.cancelScheduled')}</p>
        ) : null}

        {isAdmin && !subscribed ? <p className="text-sm text-muted">{t('billing.adminHint')}</p> : null}
        {isBeta && !subscribed ? <p className="text-sm text-muted">{t('billing.betaHint')}</p> : null}

        {status && !status.configured ? (
          <p className="text-sm text-muted">{t('billing.unavailable')}</p>
        ) : null}

        {showSubscribe ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="flex flex-col rounded-[1.35rem] border border-brand-500/40 bg-gradient-to-br from-brand-500/16 via-panel to-panel p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-brand-500 uppercase">
                  {t('billing.yearCard')}
                </p>
                <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-[#07110d] uppercase">
                  {t('home.pricing.recommended')}
                </span>
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                <p className="font-display text-3xl font-semibold tracking-tight text-ink">
                  {t('home.pricing.yearPerMonth')}
                </p>
                <p className="mb-1 text-sm text-muted">{t('home.pricing.perMonth')}</p>
              </div>
              <p className="mt-2 text-sm font-medium text-brand-500">{t('home.pricing.onlyIfYearly')}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t('home.pricing.yearCharged')}</p>
              <Button
                type="button"
                className="mt-5 w-full gap-2 sm:w-full"
                isLoading={busy === 'year'}
                disabled={busy !== null}
                onClick={() => void startCheckout('year')}
              >
                {t('billing.ctaYear')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </article>

            <article className="flex flex-col rounded-[1.35rem] border border-line bg-panel/70 p-4 sm:p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
                {t('home.pricing.orMonthly')}
              </p>
              <div className="mt-3 flex items-end gap-1.5">
                <p className="font-display text-3xl font-semibold tracking-tight text-ink">
                  {t('home.pricing.monthPrice')}
                </p>
                <p className="mb-1 text-sm text-muted">{t('home.pricing.perMonth')}</p>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {t('home.pricing.monthBilled')}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-5 w-full sm:w-full"
                isLoading={busy === 'month'}
                disabled={busy !== null}
                onClick={() => void startCheckout('month')}
              >
                {t('billing.ctaMonth')}
              </Button>
            </article>
          </div>
        ) : null}

        {showManage ? (
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

        {status && (subscribed || isBeta) ? (
          <p className="rounded-3xl bg-brand-50/80 px-4 py-4 text-sm font-medium leading-relaxed text-ink ring-1 ring-brand-500/20">
            {t('billing.proUnlocked')}
          </p>
        ) : null}

        {status && !subscribed && !isBeta ? <UsageGrid usage={status.usage} /> : null}
      </div>
    </div>
  );
}

function usagePercent(used: number, limit: number | null): number {
  if (limit == null || limit <= 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function UsageGrid({ usage }: { usage: BillingStatus['usage'] }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl bg-brand-50/50 p-4 ring-1 ring-brand-500/15 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink">{t('billing.usageTitle')}</h3>
        <p className="mt-1 text-sm text-muted">{t('billing.usageLead')}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {USAGE_KEYS.map((key) => {
          const item = usage[key];
          const limit = item.limit;
          const unlimited = limit == null;
          const percent = usagePercent(item.used, limit);
          const full = limit != null && item.used >= limit;
          const tight = !unlimited && !full && percent >= 75;
          return (
            <li key={key} className="rounded-2xl bg-panel px-4 py-3.5 ring-1 ring-line/80">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink">{t(`billing.features.${key}`)}</p>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    full ? 'text-red-500' : tight ? 'text-brand-600' : 'text-brand-500'
                  }`}
                >
                  {unlimited || limit == null
                    ? t('billing.unlimited')
                    : t('billing.of', { used: item.used, limit })}
                </p>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line/70">
                <div
                  className={`h-full rounded-full ${full ? 'bg-red-400' : 'bg-brand-500'}`}
                  style={{ width: `${unlimited ? 100 : percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 rounded-2xl bg-panel px-4 py-3 text-sm leading-relaxed text-ink ring-1 ring-line/80">
        {t('billing.mealsHint')}
      </p>
    </div>
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
