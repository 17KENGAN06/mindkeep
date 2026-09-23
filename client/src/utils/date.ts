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

export function toDateInputValue(value?: string | Date): string {
  const date = value ? (typeof value === 'string' ? parseISO(value) : value) : new Date();
  return format(date, 'yyyy-MM-dd');
}

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const local = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return local.toISOString();
}
