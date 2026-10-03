import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { adminApi, type AdminUser } from '@/api/admin';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import type { AppLanguage } from '@/i18n';
import { formatDate } from '@/utils/date';

const BETA_SEARCH_LIMIT = 8;
const HIDDEN_AUDIT_ACTIONS = new Set(['REVIEW_APPROVED', 'REVIEW_REJECTED']);

export function AdminPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [betaUserId, setBetaUserId] = useState('');
  const [betaQuery, setBetaQuery] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => (await adminApi.overview()).overview,
    enabled: user?.role === 'ADMIN',
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => (await adminApi.users()).users,
    enabled: user?.role === 'ADMIN',
  });

  const subscribersQuery = useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: async () => (await adminApi.subscribers()).subscribers,
    enabled: user?.role === 'ADMIN',
  });

  const testersQuery = useQuery({
    queryKey: ['admin', 'beta-testers'],
    queryFn: async () => (await adminApi.betaTesters()).testers,
    enabled: user?.role === 'ADMIN',
  });

  const auditQuery = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => (await adminApi.audit()).events,
    enabled: user?.role === 'ADMIN',
  });

  const setBeta = useMutation({
    mutationFn: ({ id, betaTester }: { id: string; betaTester: boolean }) =>
      adminApi.setBetaTester(id, betaTester),
    onSuccess: () => {
      setBetaUserId('');
      setBetaQuery('');
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    overviewQuery.isLoading ||
    usersQuery.isLoading ||
    subscribersQuery.isLoading ||
    testersQuery.isLoading ||
    auditQuery.isLoading
  ) {
    return <Loader />;
  }

  if (
    overviewQuery.isError ||
    usersQuery.isError ||
    subscribersQuery.isError ||
    testersQuery.isError ||
    auditQuery.isError
  ) {
    return <ErrorMessage message={t('admin.loadError')} />;
  }

  const overview = overviewQuery.data;
  const users = usersQuery.data ?? [];
  const subscribers = subscribersQuery.data ?? [];
  const testers = testersQuery.data ?? [];
  const auditEvents = (auditQuery.data ?? []).filter(
    (event) => !HIDDEN_AUDIT_ACTIONS.has(event.action),
  );
  const betaMatches = matchBetaUsers(
    users.filter((item) => item.role !== 'ADMIN' && !item.betaTester),
    betaQuery,
    BETA_SEARCH_LIMIT,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {t('admin.title')}
        </h1>
        <p className="mt-1 text-sm text-muted">{t('admin.subtitle')}</p>
      </div>

      {overview ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label={t('admin.stats.users')} value={overview.usersTotal} />
          <StatCard label={t('admin.stats.admins')} value={overview.adminsTotal} />
          <StatCard label={t('admin.stats.subscribers')} value={overview.subscribersTotal} />
          <StatCard label={t('admin.stats.beta')} value={overview.betaTestersTotal} />
          <StatCard label={t('admin.stats.materials')} value={overview.materialsTotal} />
          <StatCard label={t('admin.stats.reminders')} value={overview.remindersTotal} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.subscribersTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('admin.subscribersHint')}</p>
        </div>
        {subscribers.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.subscribersEmpty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-50/50 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.interval')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.expires')}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-line hover:bg-brand-50/70"
                    onClick={() => navigate(`/admin/users/${item.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {item.planInterval === 'YEAR'
                        ? t('billing.yearCard')
                        : item.planInterval === 'MONTH'
                          ? t('billing.monthCard')
                          : t('billing.proLabel')}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.planExpiresAt
                        ? `${formatDate(item.planExpiresAt, language)}${
                            item.cancelAtPeriodEnd ? ` · ${t('billing.cancelScheduled')}` : ''
                          }`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.betaTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('admin.betaHint')}</p>
        </div>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-1.5">
            <label className="block text-sm font-medium text-ink" htmlFor="admin-beta-search">
              {t('admin.betaSelect')}
            </label>
            <input
              id="admin-beta-search"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={betaQuery}
              placeholder={t('admin.betaSelectPlaceholder')}
              onChange={(event) => {
                setBetaQuery(event.target.value);
                setBetaUserId('');
              }}
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-panel px-3 text-sm text-ink outline-none transition placeholder:text-muted hover:border-brand-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
            {betaQuery.trim() && !betaUserId ? (
              <ul className="rounded-2xl bg-brand-50/40 p-1.5 ring-1 ring-line">
                {betaMatches.length === 0 ? (
                  <li className="px-3 py-2.5 text-sm text-muted">{t('admin.betaSearchEmpty')}</li>
                ) : (
                  betaMatches.map((item) => {
                    const active = item.id === betaUserId;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`flex w-full min-w-0 flex-col rounded-xl px-3 py-2 text-left transition ${
                            active
                              ? 'bg-brand-500 text-[#07110d] shadow-sm'
                              : 'text-ink hover:bg-panel'
                          }`}
                          onClick={() => {
                            setBetaUserId(item.id);
                            setBetaQuery(`${item.name} · ${item.email}`);
                          }}
                        >
                          <span className="truncate text-sm font-semibold">{item.name}</span>
                          <span className={`truncate text-xs ${active ? 'text-[#07110d]/80' : 'text-muted'}`}>
                            {item.email}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
          <Button
            type="button"
            className="sm:mt-7"
            disabled={!betaUserId || setBeta.isPending}
            isLoading={setBeta.isPending && Boolean(betaUserId)}
            onClick={() => setBeta.mutate({ id: betaUserId, betaTester: true })}
          >
            {t('admin.betaGrant')}
          </Button>
        </div>
        {testers.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.betaEmpty')} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {testers.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => navigate(`/admin/users/${item.id}`)}
                >
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.email}</p>
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={setBeta.isPending}
                  onClick={() => setBeta.mutate({ id: item.id, betaTester: false })}
                >
                  {t('admin.betaRevoke')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.auditTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('admin.auditHint')}</p>
        </div>
        {auditEvents.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.auditEmpty')} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {auditEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm text-ink">
                    {event.actor?.name ?? t('admin.auditAnonymous')}
                    <span className="text-muted"> · {t(`admin.auditActions.${event.action}`)}</span>
                  </p>
                </div>
                <p className="text-xs text-muted">{formatDate(event.createdAt, language)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{t('admin.usersTitle')}</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t('admin.empty')} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-50/50 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.role')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.uses')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.lastActivity')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.columns.created')}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-line hover:bg-brand-50/70"
                    onClick={() => navigate(`/admin/users/${item.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          item.role === 'ADMIN'
                            ? 'bg-brand-100 text-brand-500'
                            : item.betaTester
                              ? 'bg-brand-100 text-brand-700'
                              : item.subscribed
                                ? 'bg-brand-50 text-brand-700'
                                : 'bg-surface text-muted'
                        }`}
                      >
                        {item.role === 'ADMIN'
                          ? t('admin.roles.admin')
                          : item.betaTester
                            ? t('admin.roles.beta')
                            : item.subscribed
                              ? t('billing.proLabel')
                              : t('admin.roles.user')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(item.modules ?? []).length === 0 ? (
                        <span className="text-muted">{t('admin.idle')}</span>
                      ) : (
                        <span className="text-ink">
                          {(item.modules ?? []).map((moduleId) => t(`admin.modules.${moduleId}`)).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.lastActivityAt ? formatDate(item.lastActivityAt, language) : t('admin.noActivity')}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {format(new Date(item.createdAt), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-brand-500">{t('admin.openStats')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function matchBetaUsers(users: AdminUser[], query: string, limit: number): AdminUser[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return users
    .map((user) => {
      const name = user.name.toLowerCase();
      const email = user.email.toLowerCase();
      const haystack = `${name} ${email}`;
      let score = 99;
      if (name === needle || email === needle) score = 0;
      else if (name.startsWith(needle) || email.startsWith(needle)) score = 1;
      else if (email.split('@')[0]?.startsWith(needle)) score = 2;
      else if (haystack.includes(needle)) score = 3;
      return { user, score };
    })
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || a.user.name.localeCompare(b.user.name))
    .slice(0, limit)
    .map((item) => item.user);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="font-display mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
