import { Bell, Flag } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationSummary, useNotifications } from '@/features/notifications/useNotifications';
import { useOverdueReminders, useTodayReminders } from '@/features/reminders/useReminders';
import type { Reminder } from '@/types/reminder';
import type { AppNotification } from '@/types/notification';

const PANEL_MARGIN = 12;
const PANEL_DESKTOP_WIDTH = 352;
const PANEL_MOBILE_MAX = 767;

function panelBox(button: DOMRect): CSSProperties {
  const top = Math.round(button.bottom + 8);
  const maxHeight = Math.max(160, window.innerHeight - top - PANEL_MARGIN);
  if (window.innerWidth <= PANEL_MOBILE_MAX) {
    return {
      position: 'fixed',
      top,
      left: PANEL_MARGIN,
      right: PANEL_MARGIN,
      width: 'auto',
      maxHeight,
    };
  }

  const width = Math.min(PANEL_DESKTOP_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
  const left = Math.min(
    Math.max(PANEL_MARGIN, button.right - width),
    window.innerWidth - PANEL_MARGIN - width,
  );
  return {
    position: 'fixed',
    top,
    left,
    width,
    maxHeight,
  };
}

function ReminderRows({
  items,
  empty,
  tone,
}: {
  items: Reminder[];
  empty: string;
  tone: 'due' | 'overdue';
}) {
  if (items.length === 0) {
    return <p className="px-1 py-2 text-xs text-muted">{empty}</p>;
  }

  return (
    <ul className="space-y-1">
      {items.slice(0, 4).map((item) => (
        <li key={item.id}>
          <Link
            to={`/materials/${item.materialId}`}
            className={`block truncate rounded-xl px-2.5 py-2 text-sm font-medium transition hover:bg-panel ${
              tone === 'overdue' ? 'text-red-700/80' : 'text-ink'
            }`}
          >
            {item.material.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function NotificationBell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { data: summary } = useNotificationSummary();
  const { data: inbox, refetch: refetchInbox } = useNotifications();
  const todayQuery = useTodayReminders();
  const overdueQuery = useOverdueReminders();

  const importantItems = (inbox?.notifications ?? []).filter(
    (item): item is AppNotification => item.type === 'TASK_IMPORTANT',
  );
  const dueToday = todayQuery.data?.length ?? summary?.dueToday ?? 0;
  const overdue = overdueQuery.data?.length ?? summary?.overdue ?? 0;
  const important = importantItems.length || summary?.important || 0;
  const waiting = dueToday + overdue + important;
  const unread = summary?.unreadCount ?? 0;
  const badge = Math.max(waiting, unread);
  const hasOverdue = overdue > 0;
  const hasDue = dueToday > 0;
  const hasImportant = important > 0;

  useEffect(() => {
    if (open) void refetchInbox();
  }, [open, refetchInbox]);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const button = rootRef.current?.querySelector('button');
      if (!button) return;
      setPanelStyle(panelBox(button.getBoundingClientRect()));
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('notifications.bellLabel', { count: badge })}
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          hasOverdue
            ? 'bg-red-500/10 text-red-600 ring-1 ring-red-400/35 hover:bg-red-500/15'
            : hasImportant
              ? 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/45 hover:bg-amber-500/25'
              : hasDue || pathname === '/notifications'
                ? 'bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/40 hover:bg-brand-500/25'
                : 'text-muted hover:bg-brand-50 hover:text-brand-500'
        }`}
      >
        <Bell
          className={`h-5 w-5 ${waiting > 0 ? 'notif-bell-live' : ''}`}
          aria-hidden
        />
        {badge > 0 ? (
          <span
            className={`notif-badge-ping absolute -top-0.5 -right-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
              hasOverdue
                ? 'bg-red-500/80 text-white'
                : hasImportant
                  ? 'bg-amber-500 text-[#3a2a08]'
                  : 'bg-brand-500 text-[#07110d]'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={t('notifications.title')}
              style={panelStyle}
              className="z-50 overflow-hidden overflow-y-auto rounded-2xl bg-panel shadow-xl ring-1 ring-line"
            >
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-b border-line px-4 py-3 hover:bg-brand-50"
          >
            <p className="text-sm font-semibold text-ink">{t('notifications.title')}</p>
            <p className="mt-0.5 text-xs text-muted">
              {waiting > 0
                ? [
                    important > 0 ? t('notifications.importantCount', { count: important }) : null,
                    t('notifications.dueCount', { count: dueToday }),
                    t('notifications.overdueCount', { count: overdue }),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : t('notifications.bellEmpty')}
            </p>
          </Link>

          <div className="max-h-80 space-y-3 overflow-y-auto p-3">
            <section className={hasImportant ? 'rounded-2xl bg-amber-500/[0.08] p-1 ring-1 ring-amber-400/25' : ''}>
              <p
                className={`px-2.5 pb-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${
                  hasImportant ? 'text-amber-700' : 'text-muted'
                }`}
              >
                {t('notifications.bellImportant')} · {important}
              </p>
              {importantItems.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted">{t('notifications.bellEmptyImportant')}</p>
              ) : (
                <ul className="space-y-1">
                  {importantItems.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/tasks"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 truncate rounded-xl px-2.5 py-2 text-sm font-medium text-ink transition hover:bg-amber-50"
                      >
                        <Flag className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" aria-hidden />
                        <span className="truncate">{item.dailyTask?.title ?? item.message}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-[0.14em] text-brand-500 uppercase">
                {t('notifications.bellToday')} · {dueToday}
              </p>
              <ReminderRows
                items={todayQuery.data ?? []}
                empty={t('review.emptyTodayTitle')}
                tone="due"
              />
            </section>
            <section
              className={
                overdue > 0 ? 'rounded-2xl bg-red-500/[0.06] p-1 ring-1 ring-red-400/20' : ''
              }
            >
              <p
                className={`px-2.5 pb-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${
                  overdue > 0 ? 'text-red-600/80' : 'text-muted'
                }`}
              >
                {t('notifications.bellOverdue')} · {overdue}
              </p>
              <ReminderRows
                items={overdueQuery.data ?? []}
                empty={t('notifications.bellEmptyOverdue')}
                tone="overdue"
              />
            </section>
          </div>

          <div className="border-t border-line">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block bg-panel px-3 py-2.5 text-center text-sm font-semibold text-brand-500 hover:bg-brand-50"
            >
              {t('notifications.seeAll')}
            </Link>
            <Link
              to="/review"
              onClick={() => setOpen(false)}
              className="block border-t border-line bg-panel px-3 py-2 text-center text-xs font-medium text-muted hover:bg-brand-50 hover:text-ink"
            >
              {t('notifications.openReviews')}
            </Link>
          </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
