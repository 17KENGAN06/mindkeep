import { format, parseISO } from 'date-fns';
import { enUS, fi, ru, uk } from 'date-fns/locale';
import type { AppLanguage } from '@/i18n';

const locales = {
  en: enUS,
  ru,
  uk,
  fi,
} as const;

export function formatDate(value: string | Date, language: AppLanguage = 'en'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'd MMM yyyy', { locale: locales[language] ?? enUS });
}

export function formatDateLong(value: string | Date, language: AppLanguage = 'en'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'd MMMM yyyy', { locale: locales[language] ?? enUS });
}

export function formatChartDate(value: string | Date, language: AppLanguage = 'en'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'd MMM yyyy', { locale: locales[language] ?? enUS });
}

export function formatMonthShort(year: number, month: number, language: AppLanguage = 'en'): string {
  return format(new Date(year, month - 1, 1), 'LLL', { locale: locales[language] ?? enUS });
}

export function formatMonthTitle(year: number, month: number, language: AppLanguage = 'en'): string {
  return format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: locales[language] ?? enUS });
}

export function weekdayShort(year: number, month: number, day: number, language: AppLanguage = 'en'): string {
  return format(new Date(year, month - 1, day), 'EEEEEE', { locale: locales[language] ?? enUS });
}

export function weekdayLabels(language: AppLanguage = 'en'): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    format(new Date(2024, 0, 1 + index), 'EEEEEE', { locale: locales[language] ?? enUS }),
  );
}

export function monthCells(
  year: number,
  month: number,
): Array<{ date: string; day: number; inMonth: boolean }> {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: format(date, 'yyyy-MM-dd'),
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
    };
  });
}

export function toDateInputValue(value?: string | Date): string {
  const date = value ? (typeof value === 'string' ? parseISO(value) : value) : new Date();
  return format(date, 'yyyy-MM-dd');
}

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const local = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return local.toISOString();
}
