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

export function toDateInputValue(value?: string | Date): string {
  const date = value ? (typeof value === 'string' ? parseISO(value) : value) : new Date();
  return format(date, 'yyyy-MM-dd');
}

export function dateInputToIso(dateInput: string): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const local = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return local.toISOString();
}
