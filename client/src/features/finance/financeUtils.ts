import type { FinanceView } from '@/types/finance';

export const FINANCE_CURRENCY = 'EUR' as const;

export function formatMoney(amount: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: FINANCE_CURRENCY,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} EUR`;
  }
}

export function formatSignedMoney(amount: number, locale: string): string {
  const formatted = formatMoney(Math.abs(amount), locale);
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
