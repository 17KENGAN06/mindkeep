import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, ChevronRight, Flag, GraduationCap, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Loader } from '@/components/ui/Loader';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/useNotifications';
import { useAccountToday } from '@/features/time/useAccountToday';
import type { AppLanguage } from '@/i18n';
import type { AppNotification } from '@/types/notification';
import { dateKeyInZone, formatDateLong, shiftDateKey } from '@/utils/date';

type Filter = 'unread' | 'all' | 'important' | 'reviews';

/** Rows shown at first and added by each "Show more", so a long inbox is not one endless stack. */
const PAGE_SIZE = 20;

const TYPE_STYLE: Record<AppNotification['type'], { icon: LucideIcon; tile: string }> = {
  TASK_IMPORTANT: { icon: Flag, tile: 'bg-amber-500/15 text-amber-500' },
  REVIEW_OVERDUE: { icon: TriangleAlert, tile: 'bg-red-500/15 text-red-500' },
  REVIEW_DUE: { icon: GraduationCap, tile: 'bg-brand-500/15 text-brand-500' },
  SYSTEM: { icon: Bell, tile: 'bg-panel text-muted ring-1 ring-line' },
};

function matches(notification: AppNotification, filter: Filter) {
  if (filter === 'unread') return !notification.isRead;
  if (filter === 'important') return notification.type === 'TASK_IMPORTANT';
  if (filter === 'reviews') return notification.type === 'REVIEW_DUE' || notification.type === 'REVIEW_OVERDUE';
  return true;
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const { today, timeZone } = useAccountToday();
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [chosenFilter, setChosenFilter] = useState<Filter | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  if (isLoading) return <Loader />;
  if (isError || !data) return <ErrorMessage message={t('auth.errors.generic')} />;

  // The API returns important tasks first, then the rest; the inbox reads newest first.
  const notifications = [...data.notifications].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const filter: Filter = chosenFilter ?? (unreadCount > 0 ? 'unread' : 'all');
  const counts: Record<Filter, number> = {
    unread: unreadCount,
    all: notifications.length,
    important: notifications.filter((item) => matches(item, 'important')).length,
    reviews: notifications.filter((item) => matches(item, 'reviews')).length,
  };
  const filtered = notifications.filter((item) => matches(item, filter));
  const shown = filtered.slice(0, limit);

  // Day groups in the account time zone: Today, Yesterday, then dates.
  const yesterday = shiftDateKey(today, -1);
  const groups: Array<{ key: string; items: AppNotification[] }> = [];
  for (const item of shown) {
    const key = dateKeyInZone(new Date(item.createdAt), timeZone);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  const dayLabel = (key: string) =>
    key === today
      ? t('notifications.today')
      : key === yesterday
        ? t('notifications.yesterday')
        : formatDateLong(`${key}T12:00:00Z`, language);
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', timeZone });

  const chooseFilter = (next: Filter) => {
    setChosenFilter(next);
    setLimit(PAGE_SIZE);
  };
  const markIfUnread = (item: AppNotification) => {
    if (!item.isRead) void markRead.mutateAsync(item.id);
  };

  const filters: Filter[] = ['unread', 'all', 'important', 'reviews'];
  const filterLabel: Record<Filter, string> = {
    unread: t('notifications.filterUnread'),
    all: t('notifications.filterAll'),
    important: t('notifications.filterImportant'),
    reviews: t('notifications.filterReviews'),
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('notifications.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('notifications.subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={unreadCount === 0 || markAllRead.isPending}
          isLoading={markAllRead.isPending}
          onClick={() => void markAllRead.mutateAsync()}
        >
          {t('notifications.markAllRead')}
        </Button>
      </section>

      {notifications.length === 0 ? (
        <EmptyState title={t('notifications.emptyTitle')} description={t('notifications.emptyDescription')} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('notifications.title')}>
            {filters.map((item) => {
              const active = item === filter;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => chooseFilter(item)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition touch-manipulation ${
                    active ? 'bg-brand-500 text-[#07110d]' : 'bg-panel text-ink ring-1 ring-line hover:ring-brand-400'
                  }`}
                >
                  {item === 'unread' && counts.unread > 0 && !active ? (
                    <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  ) : null}
                  {filterLabel[item]}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? 'bg-[#07110d]/15' : 'bg-brand-500/10 text-muted'
                    }`}
                  >
                    {counts[item]}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-panel px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
              {filter === 'unread' ? t('notifications.allRead') : t('notifications.emptyFilter')}
            </p>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.key}>
                  <h2 className="px-1 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                    {dayLabel(group.key)}
                  </h2>
                  <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-panel ring-1 ring-line">
                    {group.items.map((item) => {
                      const unread = !item.isRead;
                      const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.SYSTEM;
                      const Icon = style.icon;
                      const isTask = item.type === 'TASK_IMPORTANT' || Boolean(item.dailyTaskId);
                      const target = item.materialId
                        ? { to: `/materials/${item.materialId}`, label: t('notifications.openMaterial') }
                        : isTask
                          ? { to: '/tasks', label: t('notifications.openTask') }
                          : { to: '/review', label: t('notifications.openReviews') };
                      return (
                        <li
                          key={item.id}
                          className={`flex items-start gap-3 px-4 py-3 transition ${unread ? 'bg-brand-500/[0.06]' : ''}`}
                        >
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.tile} ${
                              unread ? '' : 'opacity-60'
                            }`}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {unread ? (
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full bg-brand-500"
                                  title={t('notifications.unread')}
                                  aria-label={t('notifications.unread')}
                                />
                              ) : null}
                              <p
                                className={`min-w-0 truncate text-sm ${
                                  unread ? 'font-semibold text-ink' : 'font-medium text-muted'
                                }`}
                              >
                                {item.title}
                              </p>
                              <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">
                                {timeLabel(item.createdAt)}
                              </span>
                            </div>
                            <p className={`mt-0.5 line-clamp-2 text-sm ${unread ? 'text-ink/80' : 'text-muted'}`}>
                              {item.message}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                              <Link
                                to={target.to}
                                state={
                                  isTask && item.dailyTask
                                    ? { date: item.dailyTask.date.slice(0, 10), taskId: item.dailyTask.id }
                                    : undefined
                                }
                                onClick={() => markIfUnread(item)}
                                className="inline-flex min-h-8 items-center gap-1 font-medium text-brand-500 no-underline hover:text-brand-400"
                              >
                                {target.label}
                                <ChevronRight className="h-4 w-4" aria-hidden />
                              </Link>
                              {unread ? (
                                <button
                                  type="button"
                                  disabled={markRead.isPending && markRead.variables === item.id}
                                  onClick={() => void markRead.mutateAsync(item.id)}
                                  className="inline-flex min-h-8 items-center gap-1 text-muted transition hover:text-ink disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4" aria-hidden />
                                  {t('notifications.markRead')}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              {filtered.length > shown.length ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-full"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                >
                  {t('notifications.showMore', { count: filtered.length - shown.length })}
                </Button>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
