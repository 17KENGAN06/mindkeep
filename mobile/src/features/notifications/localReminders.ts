import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TFunction } from 'i18next';
import type { Reminder } from '../../types/reminder';
import type { AppNotification } from '../../types/notification';
import { dateKeyInZone, isoToDateKey, shiftDateKey, zonedTime } from '../../utils/date';

/**
 * On-device reminders (no server push yet): one notification per day at the chosen time with
 * that day's reviews and important tasks; overdue reviews ride along with the next one. Rebuilt
 * from fresh data every time the app is opened or the data changes.
 */

const SETTINGS_KEY = 'mk_local_reminders';
const CHANNEL_ID = 'reminders';
/** Days ahead to schedule; iOS keeps at most 64 pending notifications. */
const HORIZON_DAYS = 30;

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** The in-app "turn on reminders?" prompt was answered (either way). */
  asked: boolean;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, hour: 9, minute: 0, asked: false };

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_REMINDER_SETTINGS, ...(JSON.parse(raw) as Partial<ReminderSettings>) }
      : DEFAULT_REMINDER_SETTINGS;
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Show reminders as banners even while the app is open. Call once at startup. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(name: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#8eefb4',
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

function toState(status: Notifications.PermissionStatus): PermissionState {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function getPermissionState(): Promise<PermissionState> {
  return toState((await Notifications.getPermissionsAsync()).status);
}

/** Asks the system once; on Android 13+ the channel must exist before the prompt appears. */
export async function requestPermission(channelName: string): Promise<PermissionState> {
  await ensureChannel(channelName);
  const current = await Notifications.getPermissionsAsync();
  if (current.status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (!current.canAskAgain) return 'denied';
  return toState((await Notifications.requestPermissionsAsync()).status);
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

type ScheduleInput = {
  settings: ReminderSettings;
  timeZone: string;
  today: Reminder[];
  upcoming: Reminder[];
  overdue: Reminder[];
  notifications: AppNotification[];
  t: TFunction;
};

function listTitles(titles: string[]): string {
  const shown = titles.slice(0, 3).join(', ');
  return titles.length > 3 ? `${shown}…` : shown;
}

export async function scheduleReminders(input: ScheduleInput): Promise<number> {
  const { settings, timeZone, t } = input;
  await cancelReminders();
  if (!settings.enabled || (await getPermissionState()) !== 'granted') return 0;
  await ensureChannel(t('notifications.push.channel'));

  const now = new Date();
  const todayKey = dateKeyInZone(now, timeZone);
  const lastKey = shiftDateKey(todayKey, HORIZON_DAYS);
  const at = (key: string) => zonedTime(key, settings.hour, settings.minute, timeZone);
  const isAhead = (when: Date) => when.getTime() > now.getTime() + 30_000;

  // Group by account-calendar day: reviews by scheduled day, important tasks by their date.
  const days = new Map<string, { reviews: string[]; tasks: string[] }>();
  const dayOf = (key: string) => {
    let entry = days.get(key);
    if (!entry) {
      entry = { reviews: [], tasks: [] };
      days.set(key, entry);
    }
    return entry;
  };
  for (const reminder of [...input.today, ...input.upcoming]) {
    if (reminder.status !== 'PENDING' && reminder.status !== 'OVERDUE') continue;
    const key = dateKeyInZone(new Date(reminder.scheduledAt), timeZone);
    if (key >= todayKey && key <= lastKey) dayOf(key).reviews.push(reminder.material.title);
  }
  for (const item of input.notifications) {
    const task = item.dailyTask;
    if (item.type !== 'TASK_IMPORTANT' || !task || task.completed) continue;
    const key = isoToDateKey(task.date);
    if (key >= todayKey && key <= lastKey) dayOf(key).tasks.push(task.title);
  }

  // Overdue reviews ride along with the next reminder (today if its time is still ahead, else tomorrow).
  const overdueKey = isAhead(at(todayKey)) ? todayKey : shiftDateKey(todayKey, 1);
  if (input.overdue.length > 0) dayOf(overdueKey);

  let scheduled = 0;
  for (const [key, day] of [...days.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const when = at(key);
    if (!isAhead(when)) continue;
    const overdue = key === overdueKey ? input.overdue.length : 0;
    const onlyOverdue = overdue > 0 && day.reviews.length === 0 && day.tasks.length === 0;
    const lines = [
      day.reviews.length
        ? `${t('notifications.push.reviews', { count: day.reviews.length })} — ${listTitles(day.reviews)}`
        : null,
      day.tasks.length
        ? `${t('notifications.push.important', { count: day.tasks.length })} — ${listTitles(day.tasks)}`
        : null,
      overdue ? t('notifications.push.overdueBody', { count: overdue }) : null,
    ].filter((line): line is string => line !== null);
    if (lines.length === 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: onlyOverdue ? t('notifications.push.overdueTitle') : t('notifications.push.todayTitle'),
        body: lines.join('\n'),
        data: { target: day.reviews.length || overdue ? 'ReviewInbox' : 'TasksHome' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
    });
    scheduled += 1;
    if (scheduled >= 60) break;
  }

  return scheduled;
}
