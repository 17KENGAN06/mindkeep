import { useEffect, useRef, useState } from 'react';
import type { NotificationResponse } from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { userHasModule } from '../../config/appModules';
import { useAuth } from '../auth/useAuth';
import { useTasksPeriod } from '../tasks/useDailyTasks';
import { useAccountToday } from '../time/useAccountToday';
import {
  DEFAULT_REMINDER_SETTINGS,
  loadReminderSettings,
  saveReminderSettings,
  scheduleReminders,
  type ReminderSettings,
} from './localReminders';
import { getNotifications } from './notificationsModule';

// Fixed for the app's lifetime, so picking the hook once keeps the hook order stable.
const useLastResponse: () => NotificationResponse | null | undefined =
  getNotifications()?.useLastNotificationResponse ?? (() => null);

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
 * Keeps the on-device schedule in step with the account's important tasks (this month and the
 * next, enough for the 30-day horizon) and opens the right section when a reminder is tapped.
 * Reviews are not scheduled: they stay in the in-app bell. Mount once inside the signed-in app.
 */
export function useLocalReminderSync(onOpen: (target: ReminderTarget) => void) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const settings = useReminderSettings();
  const { timeZone, year, month } = useAccountToday();
  const withTasks = userHasModule(user, 'tasks');
  const wanted = withTasks && Boolean(settings?.enabled);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const thisMonthTasks = useTasksPeriod(year, month, wanted);
  const nextMonthTasks = useTasksPeriod(nextYear, nextMonth, wanted);

  const ready = settings !== null && (!wanted || (thisMonthTasks.data && nextMonthTasks.data));
  useEffect(() => {
    if (!ready || !settings) return;
    // Small delay: several queries often settle at once after a refresh.
    const timer = setTimeout(() => {
      void scheduleReminders({
        settings,
        timeZone,
        tasks: wanted
          ? [...(thisMonthTasks.data?.tasks ?? []), ...(nextMonthTasks.data?.tasks ?? [])]
          : [],
        t,
      }).catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [ready, settings, timeZone, wanted, thisMonthTasks.data, nextMonthTasks.data, t, i18n.language]);

  // Tapped reminder (also the one that launched the app).
  const lastResponse = useLastResponse();
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
