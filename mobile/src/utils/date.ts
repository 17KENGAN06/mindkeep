import type { AppLanguage } from '../i18n';

const intlLocales: Record<AppLanguage, string> = {
  uk: 'uk-UA',
  ru: 'ru-RU',
  en: 'en-US',
  pl: 'pl-PL',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
  fi: 'fi-FI',
};

export function todayDateKey(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isoToDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayDateKey();
  return todayDateKey(date);
}

export function lastNDateKeys(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(from);
    day.setDate(from.getDate() - (count - 1 - index));
    return todayDateKey(day);
  });
}

export function dateKey(value: Date): string {
  return todayDateKey(value);
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(at: Date, timeZone: string): ZonedParts | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const result = {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour') % 24,
      minute: get('minute'),
      second: get('second'),
    };
    return Object.values(result).every(Number.isFinite) ? result : null;
  } catch {
    // Unknown zone or no Intl time-zone support: callers fall back to the device clock.
    return null;
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** YYYY-MM-DD of `at` in an IANA time zone (the account zone); device date if the zone is unusable. */
export function dateKeyInZone(at: Date, timeZone: string): string {
  const parts = zonedParts(at, timeZone);
  if (!parts) return todayDateKey(at);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** Shift a YYYY-MM-DD key by whole days (pure calendar math, no time zone involved). */
export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + days, 12));
  return shifted.toISOString().slice(0, 10);
}

/** The `count` days ending on `todayKey`, oldest first. */
export function lastNKeysFrom(todayKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftDateKey(todayKey, index - (count - 1)));
}

/** ISO instant of 12:00 on `dateKey` in `timeZone`, using that date's offset (DST-safe). */
export function zonedNoonIso(dateKey: string, timeZone: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const wallNoon = Date.UTC(year!, month! - 1, day!, 12);
  const offsetAt = (instant: number): number | null => {
    const parts = zonedParts(new Date(instant), timeZone);
    if (!parts) return null;
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant;
  };
  const first = offsetAt(wallNoon);
  if (first === null) return dateInputToIso(dateKey);
  // Second pass measures the offset at the real local noon (matters when DST changes in between).
  const second = offsetAt(wallNoon - first) ?? first;
  return new Date(wallNoon - second).toISOString();
}

/** Whether this device can resolve the IANA zone (unknown or unsupported zones return false). */
export function isKnownTimeZone(timeZone: string): boolean {
  return zonedParts(new Date(), timeZone) !== null;
}

/**
 * True when two zones keep the same clock across the year (sampled every ~3 months, shorter
 * than any summer/winter period), so aliases (Asia/Calcutta vs Asia/Kolkata) and zones with
 * identical rules count as the same. An unknown zone also counts as the same, so it never
 * triggers a suggestion.
 */
export function zonesShareClock(a: string, b: string, todayKey: string): boolean {
  if (a === b) return true;
  if (!isKnownTimeZone(a) || !isKnownTimeZone(b)) return true;
  return [0, 91, 182, 273].every((days) => {
    const key = shiftDateKey(todayKey, days);
    return zonedNoonIso(key, a) === zonedNoonIso(key, b);
  });
}

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const local = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return local.toISOString();
}

export function formatDateLong(value: string | Date, language: AppLanguage = 'en'): string {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
      : typeof value === 'string'
        ? new Date(value)
        : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocales[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDate(value: string | Date, language: AppLanguage = 'en'): string {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
      : typeof value === 'string'
        ? new Date(value)
        : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocales[language], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonthShort(year: number, month: number, language: AppLanguage = 'en'): string {
  return new Intl.DateTimeFormat(intlLocales[language], { month: 'short' }).format(
    new Date(year, month - 1, 1),
  );
}

export function formatMonthTitle(year: number, month: number, language: AppLanguage = 'en'): string {
  return new Intl.DateTimeFormat(intlLocales[language], {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function weekdayLabels(language: AppLanguage = 'en'): string[] {
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat(intlLocales[language], { weekday: 'short' }).format(day);
  });
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function monthCells(
  year: number,
  month: number,
): Array<{ date: string; day: number; inMonth: boolean }> {
  const cells = monthGrid(year, month).map((date) => ({
    date: todayDateKey(date),
    day: date.getDate(),
    inMonth: date.getMonth() === month - 1,
  }));
  let last = cells.length - 1;
  while (last >= 0 && !cells[last]?.inMonth) last -= 1;
  return cells.slice(0, Math.ceil((last + 1) / 7) * 7);
}
