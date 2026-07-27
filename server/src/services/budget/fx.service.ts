import { BudgetCurrency } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/AppError.js';

const CBR_DAILY_JSON = 'https://www.cbr-xml-daily.ru/daily_json.js';

const FX_CURRENCIES: BudgetCurrency[] = [
  BudgetCurrency.USD,
  BudgetCurrency.EUR,
  BudgetCurrency.UAH,
];

function rateDateUtc(at = new Date()): Date {
  // Store rate day in UTC midnight for uniqueness
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

export class FxService {
  async ensureTodayRates(): Promise<Map<BudgetCurrency, number>> {
    const date = rateDateUtc();
    const existing = await prisma.exchangeRate.findMany({
      where: { date, currency: { in: FX_CURRENCIES } },
    });

    const map = new Map<BudgetCurrency, number>([[BudgetCurrency.RUB, 1]]);
    for (const row of existing) {
      map.set(row.currency, row.rateToRub);
    }

    if (FX_CURRENCIES.every((c) => map.has(c))) {
      return map;
    }

    try {
      const response = await fetch(CBR_DAILY_JSON);
      if (!response.ok) {
        throw new Error(`CBR HTTP ${response.status}`);
      }
      const payload = (await response.json()) as {
        Valute?: Record<string, { Value: number; Nominal: number }>;
      };

      const valute = payload.Valute ?? {};
      const pairs: Array<{ currency: BudgetCurrency; code: string }> = [
        { currency: BudgetCurrency.USD, code: 'USD' },
        { currency: BudgetCurrency.EUR, code: 'EUR' },
        { currency: BudgetCurrency.UAH, code: 'UAH' },
      ];

      for (const pair of pairs) {
        const entry = valute[pair.code];
        if (!entry) continue;
        const rateToRub = entry.Value / entry.Nominal;
        map.set(pair.currency, rateToRub);
        await prisma.exchangeRate.upsert({
          where: { date_currency: { date, currency: pair.currency } },
          create: { date, currency: pair.currency, rateToRub },
          update: { rateToRub },
        });
      }
    } catch {
      // Fall back to latest known rates
      const latest = await prisma.exchangeRate.findMany({
        where: { currency: { in: FX_CURRENCIES } },
        orderBy: { date: 'desc' },
        distinct: ['currency'],
      });
      for (const row of latest) {
        if (!map.has(row.currency)) {
          map.set(row.currency, row.rateToRub);
        }
      }
    }

    // Safe defaults if API and cache are empty (approximate placeholders)
    if (!map.has(BudgetCurrency.USD)) map.set(BudgetCurrency.USD, 90);
    if (!map.has(BudgetCurrency.EUR)) map.set(BudgetCurrency.EUR, 100);
    if (!map.has(BudgetCurrency.UAH)) map.set(BudgetCurrency.UAH, 2.2);

    return map;
  }

  async convert(
    amount: number,
    from: BudgetCurrency,
    to: BudgetCurrency,
  ): Promise<number> {
    if (from === to) return amount;
    const rates = await this.ensureTodayRates();
    const fromRate = rates.get(from);
    const toRate = rates.get(to);
    if (fromRate == null || toRate == null || toRate === 0) {
      throw new AppError('Exchange rate unavailable', {
        statusCode: 503,
        code: 'FX_UNAVAILABLE',
      });
    }
    const inRub = amount * fromRate;
    return Math.round((inRub / toRate) * 100) / 100;
  }

  async getTodayRatesPayload() {
    const rates = await this.ensureTodayRates();
    return {
      asOf: rateDateUtc().toISOString().slice(0, 10),
      base: 'RUB' as const,
      rates: {
        RUB: 1,
        USD: rates.get(BudgetCurrency.USD) ?? 0,
        EUR: rates.get(BudgetCurrency.EUR) ?? 0,
        UAH: rates.get(BudgetCurrency.UAH) ?? 0,
      },
    };
  }
}

export const fxService = new FxService();

export function localMonthBounds(year: number, month: number, timezone: string) {
  const startLocal = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endLocal = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    startUtc: fromZonedTime(startLocal, timezone),
    endUtc: fromZonedTime(endLocal, timezone),
  };
}

export function getLocalYearMonth(date: Date, timezone: string) {
  const zoned = toZonedTime(date, timezone);
  return { year: zoned.getFullYear(), month: zoned.getMonth() + 1 };
}

export function startOfLocalDay(date: Date, timezone: string) {
  const zoned = toZonedTime(date, timezone);
  return fromZonedTime(startOfDay(zoned), timezone);
}
