import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PermissionStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import type { TFunction } from 'i18next';
import type { DailyTask } from '../../types/dailyTask';
import { dateKeyInZone, isoToDateKey, shiftDateKey, zonedTime } from '../../utils/date';
import { getNotifications } from './notificationsModule';

/**
 * On-device reminders (no server push yet) — only for tasks marked important: the day before
 * and/or on the day, at the chosen time. Reviews never come as phone notifications; they live
 * in the in-app bell. Rebuilt from fresh data every time the app is opened or the data changes.
 */

const SETTINGS_KEY = 'mk_local_reminders';
const CHANNEL_ID = 'reminders';
/** Days ahead to schedule; iOS keeps at most 64 pending notifications. */
const HORIZON_DAYS = 30;

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Heads-up the day before an important task. */
  dayBefore: boolean;
  /** Reminder on the task's own day. */
  onTheDay: boolean;
  /** The in-app "turn on reminders?" prompt was answered (either way). */
  asked: boolean;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 9,
  minute: 0,
  dayBefore: true,
  onTheDay: true,
  asked: false,
};

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
  getNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(name: string): Promise<void> {
  const Notifications = getNotifications();
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#8eefb4',
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

// Same values as expo-notifications' PermissionStatus enum, without loading the module.
function toState(status: PermissionStatus): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getPermissionState(): Promise<PermissionState> {
  const Notifications = getNotifications();
  if (!Notifications) return 'denied';
  return toState((await Notifications.getPermissionsAsync()).status);
}

/** Asks the system once; on Android 13+ the channel must exist before the prompt appears. */
export async function requestPermission(channelName: string): Promise<PermissionState> {
  const Notifications = getNotifications();
  if (!Notifications) return 'denied';
  await ensureChannel(channelName);
  const current = await Notifications.getPermissionsAsync();
  if (current.status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (!current.canAskAgain) return 'denied';
  return toState((await Notifications.requestPermissionsAsync()).status);
}

export async function cancelReminders(): Promise<void> {
  await getNotifications()?.cancelAllScheduledNotificationsAsync();
}

type ScheduleInput = {
  settings: ReminderSettings;
  timeZone: string;
  /** Tasks of the coming weeks; only important, unfinished ones are used. */
  tasks: DailyTask[];
  t: TFunction;
};

function listTitles(titles: string[]): string {
  const shown = titles.slice(0, 3).join(', ');
  return titles.length > 3 ? `${shown}…` : shown;
}

export async function scheduleReminders(input: ScheduleInput): Promise<number> {
  const { settings, timeZone, t } = input;
  const Notifications = getNotifications();
  if (!Notifications) return 0;
  await cancelReminders();
  if (!settings.enabled || (await getPermissionState()) !== 'granted') return 0;
  if (!settings.dayBefore && !settings.onTheDay) return 0;
  await ensureChannel(t('notifications.push.channel'));

  const now = new Date();
  const todayKey = dateKeyInZone(now, timeZone);
  const lastKey = shiftDateKey(todayKey, HORIZON_DAYS);
  const at = (key: string) => zonedTime(key, settings.hour, settings.minute, timeZone);
  const isAhead = (when: Date) => when.getTime() > now.getTime() + 30_000;

  // One notification per firing day: that day's important tasks and/or tomorrow's.
  const fireDays = new Map<string, { today: string[]; tomorrow: string[] }>();
  const fireDay = (key: string) => {
    let entry = fireDays.get(key);
    if (!entry) {
      entry = { today: [], tomorrow: [] };
      fireDays.set(key, entry);
    }
    return entry;
  };
  const seen = new Set<string>();
  for (const task of input.tasks) {
    if (!task.important || task.completed || seen.has(task.id)) continue;
    seen.add(task.id);
    const key = isoToDateKey(task.date);
    if (key < todayKey || key > lastKey) continue;
    if (settings.onTheDay) fireDay(key).today.push(task.title);
    if (settings.dayBefore) fireDay(shiftDateKey(key, -1)).tomorrow.push(task.title);
  }

  let scheduled = 0;
  for (const [key, day] of [...fireDays.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const when = at(key);
    if (!isAhead(when)) continue;
    const lines = [
      day.today.length
        ? `${t('notifications.push.todayLine', { count: day.today.length })} — ${listTitles(day.today)}`
        : null,
      day.tomorrow.length
        ? `${t('notifications.push.tomorrowLine', { count: day.tomorrow.length })} — ${listTitles(day.tomorrow)}`
        : null,
    ].filter((line): line is string => line !== null);
    if (lines.length === 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: day.today.length
          ? t('notifications.push.todayTitle')
          : t('notifications.push.tomorrowTitle'),
        body: lines.join('\n'),
        data: { target: 'TasksHome' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
    });
    scheduled += 1;
    if (scheduled >= 60) break;
  }

  return scheduled;
}
