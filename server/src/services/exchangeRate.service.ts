import { BudgetCurrency } from '@prisma/client';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';

const CURRENCIES = [
  BudgetCurrency.RUB,
  BudgetCurrency.USD,
  BudgetCurrency.EUR,
  BudgetCurrency.UAH,
] as const;

type RateMap = Record<BudgetCurrency, number>;

let memoryCache: { fetchedAt: number; rates: RateMap; asOf: string } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Fetch FX rates from open.er-api.com (Open Exchange Rates open endpoint).
 * Reliable free source; no API key. We normalize everything to RUB.
 */
async function fetchRatesFromProvider(): Promise<{ rates: RateMap; asOf: string }> {
  const response = await fetch('https://open.er-api.com/v6/latest/USD', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new AppError('Failed to fetch exchange rates', {
      statusCode: 502,
      code: 'FX_PROVIDER_ERROR',
    });
  }

  const payload = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };

  if (payload.result !== 'success' || !payload.rates?.RUB) {
    throw new AppError('Exchange rate provider returned invalid data', {
      statusCode: 502,
      code: 'FX_PROVIDER_ERROR',
    });
  }

  const usdToRub = payload.rates.RUB;
  const rates: RateMap = {
    RUB: 1,
    USD: usdToRub,
    EUR: payload.rates.EUR ? usdToRub / payload.rates.EUR : usdToRub,
    UAH: payload.rates.UAH ? usdToRub / payload.rates.UAH : usdToRub,
  };

  return {
    rates,
    asOf: payload.time_last_update_utc ?? new Date().toUTCString(),
  };
}

async function persistRates(rates: RateMap, day: Date): Promise<void> {
  await Promise.all(
    CURRENCIES.map((currency) =>
      prisma.exchangeRate.upsert({
        where: {
          date_currency: { date: day, currency },
        },
        create: {
          date: day,
          currency,
          rateToRub: rates[currency],
        },
        update: {
          rateToRub: rates[currency],
        },
      }),
    ),
  );
}

async function loadRatesFromDb(day: Date): Promise<RateMap | null> {
  const rows = await prisma.exchangeRate.findMany({
    where: { date: day, currency: { in: [...CURRENCIES] } },
  });

  if (rows.length < CURRENCIES.length) {
    return null;
  }

  const rates = { RUB: 1, USD: 1, EUR: 1, UAH: 1 } as RateMap;
  for (const row of rows) {
    rates[row.currency] = row.rateToRub;
  }
  return rates;
}

export async function getRateMap(): Promise<{ rates: RateMap; asOf: string; source: string }> {
  const now = Date.now();
  if (memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return { rates: memoryCache.rates, asOf: memoryCache.asOf, source: 'cache' };
  }

  const day = startOfUtcDay();
  const fromDb = await loadRatesFromDb(day);
  if (fromDb) {
    memoryCache = { fetchedAt: now, rates: fromDb, asOf: day.toISOString() };
    return { rates: fromDb, asOf: day.toISOString(), source: 'database' };
  }

  try {
    const fresh = await fetchRatesFromProvider();
    await persistRates(fresh.rates, day);
    memoryCache = { fetchedAt: now, rates: fresh.rates, asOf: fresh.asOf };
    return { rates: fresh.rates, asOf: fresh.asOf, source: 'open.er-api.com' };
  } catch (error) {
    const latest = await prisma.exchangeRate.findMany({
      where: { currency: { in: [...CURRENCIES] } },
      orderBy: { date: 'desc' },
      take: 20,
    });

    if (latest.length > 0) {
      const newestDate = latest[0]?.date;
      const rows = latest.filter((row) => row.date.getTime() === newestDate?.getTime());
      if (rows.length >= CURRENCIES.length) {
        const rates = { RUB: 1, USD: 1, EUR: 1, UAH: 1 } as RateMap;
        for (const row of rows) {
          rates[row.currency] = row.rateToRub;
        }
        memoryCache = {
          fetchedAt: now,
          rates,
          asOf: newestDate?.toISOString() ?? new Date().toISOString(),
        };
        return {
          rates,
          asOf: memoryCache.asOf,
          source: 'database-fallback',
        };
      }
    }

    throw error;
  }
}

export function convertAmount(
  amount: number,
  from: BudgetCurrency,
  to: BudgetCurrency,
  rates: RateMap,
): number {
  if (from === to) return amount;
  const inRub = amount * rates[from];
  return inRub / rates[to];
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const FINANCE_CURRENCIES = CURRENCIES;
