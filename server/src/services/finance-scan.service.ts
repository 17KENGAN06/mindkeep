import { BudgetCurrency, BudgetMoneyKind, BudgetOperationType } from '@prisma/client';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { getEntitlement } from '@/services/entitlements.service.js';
import { decodeFoodScanImage, extractGeminiJson } from '@/services/food-scan.service.js';
import { resolveAppLocale, type AppLocale } from '@/services/emailCopy.js';
import { AppError } from '@/utils/AppError.js';
import type { ScanFinanceInput } from '@/validations/finance.schemas.js';

const GEMINI_TIMEOUT_MS = 28_000;
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const CURRENCIES = Object.values(BudgetCurrency);
const MAX_OPS = 40;

const LANGUAGE_NAME: Record<AppLocale, string> = {
  uk: 'Ukrainian',
  ru: 'Russian',
  en: 'English',
  pl: 'Polish',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  es: 'Spanish',
  fi: 'Finnish',
};

export type FinanceScanOperation = {
  date: string;
  amount: number;
  currency: BudgetCurrency;
  type: BudgetOperationType;
  moneyKind: BudgetMoneyKind;
  comment: string;
};

function throwScan(code: string, message: string, statusCode: number): never {
  throw new AppError(message, { statusCode, code });
}

function geminiModels(): string[] {
  const preferred = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  return [...new Set([preferred, ...FALLBACK_GEMINI_MODELS])];
}

function geminiErrorMeta(body: unknown): { status?: string; message?: string } {
  const error = (body as { error?: { status?: string; message?: string } } | null)?.error;
  return {
    status: error?.status,
    message: error?.message?.slice(0, 180),
  };
}

function asIsoCurrency(value: unknown): BudgetCurrency | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return CURRENCIES.includes(code as BudgetCurrency) ? (code as BudgetCurrency) : null;
}

export function inferFinanceCurrency(parts: unknown[], fallback: BudgetCurrency): BudgetCurrency {
  const blob = parts.map((part) => String(part ?? '')).join(' ');
  if (!blob.trim()) return fallback;
  const upper = blob.toUpperCase();

  if (blob.includes('₴') || /UAH|\bГРН\b|ГРИВН/i.test(blob) || /грн/i.test(blob)) return BudgetCurrency.UAH;
  if (blob.includes('€') || /\bEUR\b|\bEURO\b|ЕВРО/i.test(blob)) return BudgetCurrency.EUR;
  if (blob.includes('£') || /\bGBP\b|ФУНТ/i.test(blob)) return BudgetCurrency.GBP;
  if (/zł|\bPLN\b|ZLOTY|ЗЛОТ/i.test(blob)) return BudgetCurrency.PLN;
  if (/\bCHF\b|ФРАНК/i.test(blob)) return BudgetCurrency.CHF;
  if (/\bCZK\b/i.test(blob)) return BudgetCurrency.CZK;
  if (/\bRON\b|ЛЕ[ЙИ]/i.test(blob)) return BudgetCurrency.RON;
  if (/\bTRY\b|ЛИР/i.test(blob)) return BudgetCurrency.TRY;
  if (/\bGEL\b|ЛАРИ/i.test(blob)) return BudgetCurrency.GEL;
  if (/\bKZT\b|ТЕНГ/i.test(blob)) return BudgetCurrency.KZT;
  if (/\bRUB\b|РУБ/i.test(blob)) return BudgetCurrency.RUB;
  if (/\bUSD\b|ДОЛЛАР|DOLLAR/i.test(upper) || blob.includes('$')) return BudgetCurrency.USD;

  const iso = asIsoCurrency(blob.split(/[\s,;]+/).find((token) => asIsoCurrency(token)));
  return iso ?? fallback;
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dotted = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (!dotted) return null;
  const day = dotted[1]!.padStart(2, '0');
  const month = dotted[2]!.padStart(2, '0');
  let year = dotted[3]!;
  if (year.length === 2) year = Number(year) > 70 ? `19${year}` : `20${year}`;
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return null;
  return `${year}-${month}-${day}`;
}

export function parseFinanceScanAiPayload(
  raw: unknown,
  fallback: BudgetCurrency = BudgetCurrency.EUR,
): FinanceScanOperation[] {
  if (!raw || typeof raw !== 'object') {
    throwScan('FINANCE_SCAN_EMPTY', 'Could not read operations from the photo', 422);
  }

  const list = (raw as { operations?: unknown }).operations;
  if (!Array.isArray(list) || list.length === 0) {
    throwScan('FINANCE_SCAN_EMPTY', 'Could not read operations from the photo', 422);
  }

  const operations: FinanceScanOperation[] = [];
  for (const item of list.slice(0, MAX_OPS)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const date = asDate(row.date);
    const amount = Math.round(Math.abs(Number(row.amount)) * 100) / 100;
    const currency = inferFinanceCurrency(
      [row.currency, row.comment, row.description, row.symbol],
      fallback,
    );
    const typeRaw = String(row.type ?? '').toUpperCase();
    const type = typeRaw === 'INCOME' ? BudgetOperationType.INCOME : BudgetOperationType.EXPENSE;
    const kindRaw = String(row.moneyKind ?? row.money_kind ?? '').toUpperCase();
    const moneyKind = kindRaw === 'CASH' ? BudgetMoneyKind.CASH : BudgetMoneyKind.ELECTRONIC;
    const comment = String(row.comment ?? row.description ?? '')
      .trim()
      .slice(0, 500);
    if (!date || !Number.isFinite(amount) || amount <= 0) continue;
    operations.push({ date, amount, currency, type, moneyKind, comment });
  }

  if (operations.length === 0) {
    throwScan('FINANCE_SCAN_EMPTY', 'Could not read operations from the photo', 422);
  }

  return operations;
}

async function callGemini(
  model: string,
  key: string,
  buffer: Buffer,
  mimeType: string,
  locale: AppLocale,
  fallback: BudgetCurrency,
  options: { jsonMime: boolean; thinkingOff: boolean },
): Promise<{ ok: true; payload: unknown } | { ok: false; status: number; googleStatus?: string }> {
  const language = LANGUAGE_NAME[locale];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const generationConfig: Record<string, unknown> = {
    temperature: 0.1,
  };
  if (options.jsonMime) {
    generationConfig.responseMimeType = 'application/json';
  }
  if (options.thinkingOff) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: [
                    'Extract money movements from this receipt, card statement, or bank screenshot.',
                    `Reply with JSON only: {"operations":[{"date":"YYYY-MM-DD","amount":number,"type":"INCOME"|"EXPENSE","currency":"${CURRENCIES.join('|')}","comment":string,"moneyKind":"CASH"|"ELECTRONIC"}]}`,
                    'amount is always a positive number. type INCOME for money in, EXPENSE for money out.',
                    `comment in ${language}, max 80 characters: merchant or description.`,
                    'moneyKind CASH for paper receipts, ELECTRONIC for bank or card statements.',
                    'Detect currency from symbols and codes: ₴ грн UAH, € EUR, $ USD, zł PLN, £ GBP, and the other ISO codes in the list.',
                    `If the currency is truly not visible, use ${fallback}. Never default to EUR when another currency is on the photo.`,
                    'Max 40 operations. If this is not a receipt or statement, operations is [].',
                    'No extra keys or markdown.',
                  ].join(' '),
                },
                {
                  inlineData: {
                    mimeType,
                    data: buffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig,
        }),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throwScan('FINANCE_SCAN_FAILED', 'Could not read the photo', 504);
    }
    throwScan('FINANCE_SCAN_FAILED', 'Could not read the photo', 502);
  } finally {
    clearTimeout(timer);
  }

  const body = (await response.json().catch(() => null)) as unknown;
  if (response.ok) {
    return { ok: true, payload: body };
  }

  const meta = geminiErrorMeta(body);
  logger.warn('Finance scan Gemini rejected', { model, http: response.status, ...meta });
  return { ok: false, status: response.status, googleStatus: meta.status };
}

async function extractWithGemini(
  buffer: Buffer,
  mimeType: string,
  locale: AppLocale,
  fallback: BudgetCurrency,
): Promise<FinanceScanOperation[]> {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throwScan('FINANCE_SCAN_UNAVAILABLE', 'Finance scan is not connected yet', 503);
  }

  let sawAuthFailure = false;
  let lastFailure: { status: number; googleStatus?: string } | null = null;

  for (const model of geminiModels()) {
    const attempts = [
      { jsonMime: true, thinkingOff: true },
      { jsonMime: true, thinkingOff: false },
      { jsonMime: false, thinkingOff: false },
    ];

    for (const options of attempts) {
      const result = await callGemini(model, key, buffer, mimeType, locale, fallback, options);
      if (result.ok) {
        return parseFinanceScanAiPayload(extractGeminiJson(result.payload), fallback);
      }

      lastFailure = result;
      if (result.status === 401 || result.status === 403) {
        sawAuthFailure = true;
        break;
      }
      if (result.status === 404 || result.googleStatus === 'NOT_FOUND') {
        break;
      }
      if (result.status === 429) {
        throwScan('RATE_LIMITED', 'Too many finance scans. Please try again later.', 429);
      }
    }
  }

  if (sawAuthFailure) {
    throwScan('FINANCE_SCAN_UNAVAILABLE', 'Finance scan is not connected yet', 503);
  }
  logger.warn('Finance scan Gemini exhausted models', lastFailure ?? {});
  throwScan('FINANCE_SCAN_FAILED', 'Could not read the photo', 502);
}

export const financeScanService = {
  async scanStatement(
    userId: string,
    input: ScanFinanceInput,
    localeHeader?: string | null,
  ): Promise<{ operations: FinanceScanOperation[] }> {
    const entitlement = await getEntitlement(userId);
    if (!entitlement.automation) {
      throwScan('FINANCE_IMPORT_PRO_REQUIRED', 'Finance scan is included in Pro', 403);
    }

    const { buffer, mimeType } = decodeFoodScanImage(input.image, input.mimeType);
    const locale = resolveAppLocale(localeHeader);
    const fallback = input.fallbackCurrency ?? BudgetCurrency.EUR;
    return { operations: await extractWithGemini(buffer, mimeType, locale, fallback) };
  },
};
