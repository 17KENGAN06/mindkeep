import { BudgetCurrency } from '@prisma/client';

const CURRENCY_SET = new Set<string>(Object.values(BudgetCurrency));

export type MonthlyLimitsMap = Partial<Record<BudgetCurrency, number>>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseMonthlyLimits(value: unknown): MonthlyLimitsMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: MonthlyLimitsMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!CURRENCY_SET.has(key)) continue;
    const amount = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    out[key as BudgetCurrency] = roundMoney(amount);
  }
  return out;
}

export function applyMonthlyLimit(
  current: MonthlyLimitsMap,
  currency: BudgetCurrency,
  amount: number | null,
): MonthlyLimitsMap {
  const next: MonthlyLimitsMap = { ...current };
  if (amount == null || amount <= 0) {
    delete next[currency];
    return next;
  }
  next[currency] = roundMoney(amount);
  return next;
}
