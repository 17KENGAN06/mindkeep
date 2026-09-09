import type { FinanceCurrency, FinanceView } from '@/types/finance';

export const FINANCE_CURRENCIES: FinanceCurrency[] = ['UAH', 'RUB', 'EUR', 'USD'];

export function formatMoney(amount: number, currency: FinanceCurrency, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function currentPeriodDefaults(): { year: number; month: number; view: FinanceView } {
  const now = new Date();
  return {
    view: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function yearOptions(centerYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let year = centerYear - 5; year <= centerYear + 1; year += 1) {
    years.push(year);
  }
  return years;
}
