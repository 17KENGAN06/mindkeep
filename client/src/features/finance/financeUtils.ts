import type { FinanceView } from '@/types/finance';

export const FINANCE_CURRENCY = 'EUR' as const;

export function formatMoney(amount: number, locale: string, currency: string = FINANCE_CURRENCY): string {
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

export function formatSignedMoney(amount: number, locale: string, currency: string = FINANCE_CURRENCY): string {
  const formatted = formatMoney(Math.abs(amount), locale, currency);
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

export function yearOptions(centerYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let year = centerYear - 5; year <= centerYear + 1; year += 1) {
    years.push(year);
  }
  return years;
}
