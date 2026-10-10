import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * expo-notifications throws while loading in Expo Go on Android (remote push was removed from
 * Expo Go in SDK 53), which crashes the whole app at startup. There the module is never loaded
 * and phone reminders are simply unavailable; real builds (APK / store / iOS) are unaffected.
 */
export const phoneRemindersAvailable = !(Platform.OS === 'android' && isRunningInExpoGo());

let loaded: NotificationsModule | null = null;

/** The expo-notifications module, loaded on first use; null where it cannot run. */
export function getNotifications(): NotificationsModule | null {
  if (!phoneRemindersAvailable) return null;
  // Deferred require on purpose: a top-level import would run the module's crashing startup code.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  loaded ??= require('expo-notifications') as NotificationsModule;
  return loaded;
}
