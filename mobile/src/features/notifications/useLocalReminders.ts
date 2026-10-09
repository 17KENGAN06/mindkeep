import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { useOverdueReminders, useTodayReminders, useUpcomingReminders } from '../reminders/useReminders';
import { useAccountToday } from '../time/useAccountToday';
import { useNotifications } from './useNotifications';
import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  scheduleReminders,
  type ReminderSettings,
} from './localReminders';

// One shared copy of the settings, so Settings and the scheduler see the same values.
let current: ReminderSettings | null = null;
let loading: Promise<ReminderSettings> | null = null;
const listeners = new Set<(settings: ReminderSettings) => void>();

function publish(next: ReminderSettings) {
  current = next;
  listeners.forEach((listener) => listener(next));
}

export async function updateReminderSettings(patch: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const base = current ?? (await loadReminderSettings());
  const next = { ...base, ...patch };
  publish(next);
  await saveReminderSettings(next);
  return next;
}

/** Reminder settings (null while loading from storage). */
export function useReminderSettings(): ReminderSettings | null {
  const [settings, setSettings] = useState<ReminderSettings | null>(current);
  useEffect(() => {
    listeners.add(setSettings);
    if (!current) {
      loading ??= loadReminderSettings();
      void loading.then((loaded) => {
        if (!current) publish(loaded);
        else setSettings(current);
      });
    }
    return () => {
      listeners.delete(setSettings);
    };
  }, []);
  return settings;
}

export type ReminderTarget = 'ReviewInbox' | 'TasksHome';

/**
 * Keeps the on-device schedule in step with the account's reviews and important tasks, and
 * opens the right section when a reminder is tapped. Mount once inside the signed-in app.
 */
export function useLocalReminderSync(onOpen: (target: ReminderTarget) => void) {
  const { t, i18n } = useTranslation();
  const settings = useReminderSettings();
  const { timeZone } = useAccountToday();
  const today = useTodayReminders();
  const upcoming = useUpcomingReminders();
  const overdue = useOverdueReminders();
  const inbox = useNotifications();

  const ready = settings !== null && today.data && upcoming.data && overdue.data && inbox.data;
  useEffect(() => {
    if (!ready || !settings) return;
    // Small delay: several queries often settle at once after a refresh.
    const timer = setTimeout(() => {
      void scheduleReminders({
        settings,
        timeZone,
        today: today.data ?? [],
        upcoming: upcoming.data ?? [],
        overdue: overdue.data ?? [],
        notifications: inbox.data?.notifications ?? [],
        t,
      }).catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [ready, settings, timeZone, today.data, upcoming.data, overdue.data, inbox.data, t, i18n.language]);

  // Tapped reminder (also the one that launched the app).
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const target = lastResponse.notification.request.content.data?.target;
    openRef.current(target === 'TasksHome' ? 'TasksHome' : 'ReviewInbox');
  }, [lastResponse]);
}

export { DEFAULT_REMINDER_SETTINGS };
