import { FINANCE_CURRENCIES } from '@/features/finance/currencies';
import type { FinanceMoneyKind, FinanceOperation, FinanceView } from '@/types/finance';

export const FINANCE_CURRENCY = 'EUR' as const;

export type FinanceKindBucket = {
  income: number;
  expense: number;
  balance: number;
};

export type FinanceCurrencyBucket = {
  currency: string;
  income: number;
  expense: number;
  balance: number;
  byKind: Record<FinanceMoneyKind, FinanceKindBucket>;
  byMonth: Array<{ month: number; income: number; expense: number; balance: number }>;
};

function emptyKindBucket(): FinanceKindBucket {
  return { income: 0, expense: 0, balance: 0 };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function emptyCurrencyBucket(currency: string): FinanceCurrencyBucket {
  return {
    currency,
    income: 0,
    expense: 0,
    balance: 0,
    byKind: { CASH: emptyKindBucket(), ELECTRONIC: emptyKindBucket() },
    byMonth: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      income: 0,
      expense: 0,
      balance: 0,
    })),
  };
}

function sortCurrencyBuckets(buckets: FinanceCurrencyBucket[]): FinanceCurrencyBucket[] {
  const ranked = FINANCE_CURRENCIES as readonly string[];
  return [...buckets].sort((left, right) => {
    const leftIndex = ranked.indexOf(left.currency);
    const rightIndex = ranked.indexOf(right.currency);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

export function withBudgetCurrencies(
  buckets: FinanceCurrencyBucket[],
  monthlyLimits: Partial<Record<string, number>>,
): FinanceCurrencyBucket[] {
  const seen = new Set(buckets.map((bucket) => bucket.currency));
  const extra = Object.keys(monthlyLimits)
    .filter((code) => monthlyLimits[code] && monthlyLimits[code]! > 0 && !seen.has(code))
    .map((code) => emptyCurrencyBucket(code));
  return extra.length === 0 ? buckets : sortCurrencyBuckets([...buckets, ...extra]);
}

export function expenseByCurrency(operations: FinanceOperation[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const operation of operations) {
    if (operation.type !== 'EXPENSE') continue;
    const currency = operation.currency || FINANCE_CURRENCY;
    map[currency] = roundMoney((map[currency] ?? 0) + operation.amount);
  }
  return map;
}

export function periodBudgetTarget(monthlyLimit: number | undefined, view: FinanceView): number | null {
  if (monthlyLimit == null || monthlyLimit <= 0) return null;
  return view === 'year' ? roundMoney(monthlyLimit * 12) : monthlyLimit;
}

export function summarizeByCurrency(operations: FinanceOperation[]): FinanceCurrencyBucket[] {
  const map = new Map<string, FinanceCurrencyBucket>();

  for (const operation of operations) {
    const currency = operation.currency || FINANCE_CURRENCY;
    let bucket = map.get(currency);
    if (!bucket) {
      bucket = {
        currency,
        income: 0,
        expense: 0,
        balance: 0,
        byKind: { CASH: emptyKindBucket(), ELECTRONIC: emptyKindBucket() },
        byMonth: Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          income: 0,
          expense: 0,
          balance: 0,
        })),
      };
      map.set(currency, bucket);
    }

    const kind: FinanceMoneyKind = operation.moneyKind === 'CASH' ? 'CASH' : 'ELECTRONIC';
    const monthIndex = new Date(operation.date).getUTCMonth();
    const month = bucket.byMonth[monthIndex];

    if (operation.type === 'INCOME') {
      bucket.income += operation.amount;
      bucket.byKind[kind].income += operation.amount;
      if (month) month.income += operation.amount;
    } else {
      bucket.expense += operation.amount;
      bucket.byKind[kind].expense += operation.amount;
      if (month) month.expense += operation.amount;
    }
  }

  const ranked = FINANCE_CURRENCIES as readonly string[];
  return [...map.values()]
    .map((bucket) => {
      bucket.income = roundMoney(bucket.income);
      bucket.expense = roundMoney(bucket.expense);
      bucket.balance = roundMoney(bucket.income - bucket.expense);
      for (const kind of ['CASH', 'ELECTRONIC'] as const) {
        const row = bucket.byKind[kind];
        row.income = roundMoney(row.income);
        row.expense = roundMoney(row.expense);
        row.balance = roundMoney(row.income - row.expense);
      }
      for (const month of bucket.byMonth) {
        month.income = roundMoney(month.income);
        month.expense = roundMoney(month.expense);
        month.balance = roundMoney(month.income - month.expense);
      }
      return bucket;
    })
    .sort((left, right) => {
      const leftIndex = ranked.indexOf(left.currency);
      const rightIndex = ranked.indexOf(right.currency);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
}

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
