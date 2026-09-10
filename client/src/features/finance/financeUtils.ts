import type { FinanceCurrency, FinanceCurrencyTotals, FinanceView } from '@/types/finance';

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

/** Signed money for multi-currency ledgers, e.g. +$1,000 / −€500 */
export function formatSignedMoney(
  amount: number,
  currency: FinanceCurrency,
  locale: string,
): string {
  const formatted = formatMoney(Math.abs(amount), currency, locale);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `−${formatted}`;
  return formatted;
}

export function formatCurrencyLines(
  items: Array<{ amount: number; currency: FinanceCurrency }>,
  locale: string,
  signed = false,
): string {
  if (items.length === 0) return formatMoney(0, 'EUR', locale);
  return items
    .map((item) =>
      signed
        ? formatSignedMoney(item.amount, item.currency, locale)
        : formatMoney(item.amount, item.currency, locale),
    )
    .join(' · ');
}

export function pickFieldByCurrency(
  totals: FinanceCurrencyTotals[],
  field: 'income' | 'expense' | 'balance',
): Array<{ amount: number; currency: FinanceCurrency }> {
  return totals
    .filter((item) => item[field] !== 0)
    .map((item) => ({ amount: item[field], currency: item.currency }));
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
