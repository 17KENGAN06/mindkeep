import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { adminApi, type AdminActivityModuleId } from '@/api/admin';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { formatDateLong } from '@/utils/date';
import type { AppLanguage } from '@/i18n';

function moduleHint(
  id: AdminActivityModuleId,
  extra: Record<string, number>,
  count: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (id === 'review') {
    return t('admin.moduleHints.review', { reminders: extra.reminders ?? 0, completed: extra.completed ?? 0 });
  }
  if (id === 'tasks') {
    return t('admin.moduleHints.tasks', { completed: extra.completed ?? 0 });
  }
  if (id === 'habits') {
    return t('admin.moduleHints.habits', { checks: extra.checks ?? 0 });
  }
  if (id === 'nutrition') {
    return t('admin.moduleHints.nutrition', {
      meals: extra.meals ?? 0,
      water: extra.waterDays ?? 0,
      weight: extra.weightDays ?? 0,
    });
  }
  return t('admin.moduleHints.count', { count });
}

export function AdminUserPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const activityQuery = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => (await adminApi.userActivity(id!)).activity,
    enabled: user?.role === 'ADMIN' && Boolean(id),
  });

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (activityQuery.isLoading) {
    return <Loader />;
  }

  if (activityQuery.isError || !activityQuery.data) {
    return <ErrorMessage message={t('admin.loadError')} />;
  }

  const { user: profile, lastActivityAt, modules, recent } = activityQuery.data;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link to="/admin" className="text-sm font-medium text-brand-500 no-underline hover:underline">
          ← {t('admin.backToUsers')}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{profile.name}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.activitySubtitle')}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label={t('admin.columns.email')} value={profile.email} />
        <InfoCard
          label={t('admin.columns.role')}
          value={profile.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
        />
        <InfoCard label={t('admin.columns.timezone')} value={profile.timezone} />
        <InfoCard
          label={t('admin.columns.lastActivity')}
          value={lastActivityAt ? formatDateLong(lastActivityAt, language) : t('admin.noActivity')}
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink">{t('admin.modulesTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('admin.modulesHint')}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl p-4 shadow-sm ring-1 ${
                item.used ? 'bg-panel ring-line' : 'bg-brand-50/30 ring-line/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{t(`admin.modules.${item.id}`)}</p>
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                    item.used ? 'bg-brand-100 text-brand-500' : 'bg-surface text-muted'
                  }`}
                >
                  {item.used ? t('admin.used') : t('admin.idle')}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-ink">{item.count}</p>
              <p className="mt-1 text-xs text-muted">{moduleHint(item.id, item.extra, item.count, t)}</p>
              <p className="mt-2 text-xs text-muted">
                {item.lastAt
                  ? t('admin.lastUsed', { date: formatDateLong(item.lastAt, language) })
                  : t('admin.neverUsed')}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-sm font-semibold text-ink">{t('admin.recentTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('admin.recentHint')}</p>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t('admin.noActivity')}</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {recent.map((event, index) => (
              <li
                key={`${event.at}-${event.module}-${event.action}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-brand-50/40 px-3 py-2.5 ring-1 ring-line/70"
              >
                <p className="text-sm font-medium text-ink">
                  {t(`admin.modules.${event.module}`)} · {t(`admin.actions.${event.action}`)}
                </p>
                <p className="text-xs text-muted">{formatDateLong(event.at, language)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel p-4 shadow-sm ring-1 ring-line">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
