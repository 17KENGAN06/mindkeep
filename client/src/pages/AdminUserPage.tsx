import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { adminApi, type AdminActivityModuleId } from '@/api/admin';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/features/auth/useAuth';
import { formatDate, formatDateLong } from '@/utils/date';
import type { AppLanguage } from '@/i18n';

function moduleHint(
  id: AdminActivityModuleId,
  extra: Record<string, number>,
  count: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (id === 'review') {
    return t('admin.moduleHints.review', {
      materials: extra.materials ?? count,
      reminders: extra.reminders ?? 0,
      completed: extra.completed ?? 0,
      pending: extra.pending ?? 0,
    });
  }
  if (id === 'tasks') {
    return t('admin.moduleHints.tasks', {
      count,
      completed: extra.completed ?? 0,
      last30: extra.last30 ?? 0,
    });
  }
  if (id === 'habits') {
    return t('admin.moduleHints.habits', {
      count,
      active: extra.active ?? 0,
      checks: extra.checks ?? 0,
      last30: extra.last30 ?? 0,
    });
  }
  if (id === 'nutrition') {
    return t('admin.moduleHints.nutrition', {
      meals: extra.meals ?? 0,
      water: extra.waterDays ?? 0,
      weight: extra.weightDays ?? 0,
    });
  }
  if (id === 'finance') {
    return t('admin.moduleHints.finance', {
      count,
      income: extra.income ?? 0,
      expense: extra.expense ?? 0,
    });
  }
  return t('admin.moduleHints.notes', { count });
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

  const { user: profile, lastActivityAt, summary, timeline, modules, recent } = activityQuery.data;
  const max = Math.max(...timeline.map((point) => point.count), 1);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link to="/admin" className="text-sm font-medium text-brand-500 no-underline hover:underline">
          ← {t('admin.backToUsers')}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{profile.name}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.activitySubtitle')}</p>
        <p className="mt-2 text-xs text-muted">
          {t('admin.registered', { date: formatDateLong(profile.createdAt, language) })}
          {' · '}
          {profile.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label={t('admin.summary.modulesUsed')}
          value={`${summary.modulesUsed} / ${summary.modulesTotal}`}
        />
        <InfoCard label={t('admin.summary.activeDays')} value={String(summary.activeDays30)} />
        <InfoCard label={t('admin.summary.events7')} value={String(summary.events7)} />
        <InfoCard
          label={t('admin.columns.lastActivity')}
          value={lastActivityAt ? formatDateLong(lastActivityAt, language) : t('admin.noActivity')}
        />
      </section>

      <section className="rounded-3xl bg-panel p-5 shadow-sm ring-1 ring-line">
        <h2 className="text-sm font-semibold text-ink">{t('admin.timelineTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('admin.timelineHint')}</p>
        <div className="mt-5 flex h-28 items-end gap-0.5 sm:gap-1">
          {timeline.map((point) => {
            const height = `${Math.max((point.count / max) * 100, point.count > 0 ? 10 : 3)}%`;
            return (
              <div
                key={point.date}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
                title={`${formatDate(point.date, language)}: ${point.count}`}
              >
                <div
                  className={`w-full max-w-3 rounded-t ${point.count > 0 ? 'bg-brand-500' : 'bg-brand-100'}`}
                  style={{ height }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{timeline[0] ? formatDate(timeline[0].date, language) : ''}</span>
          <span>{t('admin.timelineTotal', { count: summary.events30 })}</span>
          <span>
            {timeline[timeline.length - 1]
              ? formatDate(timeline[timeline.length - 1]!.date, language)
              : ''}
          </span>
        </div>
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
                {item.firstAt
                  ? t('admin.firstUsed', { date: formatDateLong(item.firstAt, language) })
                  : t('admin.neverUsed')}
              </p>
              {item.lastAt ? (
                <p className="mt-1 text-xs text-muted">
                  {t('admin.lastUsed', { date: formatDateLong(item.lastAt, language) })}
                </p>
              ) : null}
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
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
