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

export function formatMoney(amount: number, language: AppLanguage): string {
  try {
    return new Intl.NumberFormat(intlLocales[language], {
      style: 'currency',
      currency: FINANCE_CURRENCY,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} EUR`;
  }
}

export function formatSignedMoney(amount: number, language: AppLanguage): string {
  const formatted = formatMoney(Math.abs(amount), language);
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
