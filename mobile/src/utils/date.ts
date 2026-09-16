import type { AppLanguage } from '../i18n';

const intlLocales: Record<AppLanguage, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  uk: 'uk-UA',
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

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const local = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return local.toISOString();
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
