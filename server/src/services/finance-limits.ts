import { BudgetCurrency } from '@prisma/client';

const CURRENCY_SET = new Set<string>(Object.values(BudgetCurrency));
const PERIOD_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type MonthlyLimitsMap = Partial<Record<BudgetCurrency, number>>;
export type PeriodLimitsMap = Record<string, MonthlyLimitsMap>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function budgetPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
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

export function parsePeriodLimits(value: unknown): { limits: PeriodLimitsMap; migratedFromLegacy: boolean } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { limits: {}, migratedFromLegacy: false };
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const periodEntries = entries.filter(([key]) => PERIOD_KEY.test(key));
  if (periodEntries.length > 0) {
    const limits: PeriodLimitsMap = {};
    for (const [key, raw] of periodEntries) {
      const inner = parseMonthlyLimits(raw);
      if (Object.keys(inner).length > 0) limits[key] = inner;
    }
    return { limits, migratedFromLegacy: false };
  }

  const legacy = parseMonthlyLimits(value);
  if (Object.keys(legacy).length === 0) return { limits: {}, migratedFromLegacy: false };

  const now = new Date();
  return {
    limits: { [budgetPeriodKey(now.getUTCFullYear(), now.getUTCMonth() + 1)]: legacy },
    migratedFromLegacy: true,
  };
}

export function applyPeriodLimit(
  current: PeriodLimitsMap,
  year: number,
  month: number,
  currency: BudgetCurrency,
  amount: number | null,
): PeriodLimitsMap {
  const key = budgetPeriodKey(year, month);
  const bucket: MonthlyLimitsMap = { ...(current[key] ?? {}) };
  if (amount == null || amount <= 0) {
    delete bucket[currency];
  } else {
    bucket[currency] = roundMoney(amount);
  }
  const next: PeriodLimitsMap = { ...current };
  if (Object.keys(bucket).length === 0) delete next[key];
  else next[key] = bucket;
  return next;
}

export function limitsForPeriod(all: PeriodLimitsMap, year: number, month: number): MonthlyLimitsMap {
  return all[budgetPeriodKey(year, month)] ?? {};
}

export function yearCapForCurrency(all: PeriodLimitsMap, year: number, currency: string): number | null {
  let sum = 0;
  let any = false;
  for (let month = 1; month <= 12; month += 1) {
    const cap = all[budgetPeriodKey(year, month)]?.[currency as BudgetCurrency];
    if (cap && cap > 0) {
      sum += cap;
      any = true;
    }
  }
  return any ? roundMoney(sum) : null;
}

export function currenciesWithPeriodCaps(all: PeriodLimitsMap, year: number, month?: number): string[] {
  if (month != null) return Object.keys(limitsForPeriod(all, year, month));
  const codes = new Set<string>();
  for (let index = 1; index <= 12; index += 1) {
    for (const code of Object.keys(all[budgetPeriodKey(year, index)] ?? {})) codes.add(code);
  }
  return [...codes];
}
