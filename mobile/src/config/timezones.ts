export const DEFAULT_TIMEZONE = 'Europe/Helsinki';

export const APP_TIMEZONES = [
  'Europe/Helsinki',
  'Europe/Kyiv',
  'Europe/Moscow',
  'Europe/Tallinn',
  'Europe/Riga',
  'Europe/Vilnius',
  'Europe/Warsaw',
  'Europe/Berlin',
  'Europe/Stockholm',
  'Europe/London',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
] as const;

export function detectDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function timezoneChoices(current?: string | null): string[] {
  const extra = [detectDeviceTimezone(), current ?? ''].filter(Boolean);
  return [...new Set([...extra, ...APP_TIMEZONES])];
}
