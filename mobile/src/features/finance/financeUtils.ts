import type { AppLanguage } from '../../i18n';
import type { FinanceView } from '../../types/finance';

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

export const FINANCE_CURRENCY = 'EUR' as const;

export function formatMoney(amount: number, language: AppLanguage, currency: string = FINANCE_CURRENCY): string {
  try {
    return new Intl.NumberFormat(intlLocales[language], {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatSignedMoney(amount: number, language: AppLanguage, currency: string = FINANCE_CURRENCY): string {
  const formatted = formatMoney(Math.abs(amount), language, currency);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `−${formatted}`;
  return formatted;
}

export function currentPeriodDefaults(): { year: number; month: number; view: FinanceView } {
  const now = new Date();
  return {
    view: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}
