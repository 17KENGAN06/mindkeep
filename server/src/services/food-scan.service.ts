import { env } from '@/config/env.js';
import { getEntitlement } from '@/services/entitlements.service.js';
import { resolveAppLocale, type AppLocale } from '@/services/emailCopy.js';
import { AppError } from '@/utils/AppError.js';
import type { ScanFoodInput } from '@/validations/nutrition.schemas.js';

export const FOOD_SCAN_MAX_BYTES = 700_000;
const GEMINI_TIMEOUT_MS = 22_000;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

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

export type FoodScanEstimate = {
  mealName: string;
  totalCalories: number;
};

function throwScan(code: string, message: string, statusCode: number): never {
  throw new AppError(message, { statusCode, code });
}

export function detectFoodScanMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function decodeFoodScanImage(image: string, claimedType: ScanFoodInput['mimeType']): {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
} {
  const compact = image.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact) || compact.length % 4 !== 0) {
    throwScan('FOOD_SCAN_INVALID', 'Invalid image payload', 400);
  }

  const buffer = Buffer.from(compact, 'base64');
  if (buffer.length < 32) {
    throwScan('FOOD_SCAN_INVALID', 'Invalid image payload', 400);
  }
  if (buffer.length > FOOD_SCAN_MAX_BYTES) {
    throwScan('FOOD_SCAN_TOO_LARGE', 'Photo is too large', 413);
  }

  const detected = detectFoodScanMime(buffer);
  if (!detected) {
    throwScan('FOOD_SCAN_BAD_TYPE', 'Use a JPEG, PNG, or WebP photo', 400);
  }
  if (detected !== claimedType) {
    throwScan('FOOD_SCAN_BAD_TYPE', 'Use a JPEG, PNG, or WebP photo', 400);
  }

  return { buffer, mimeType: detected };
}

export function parseFoodScanAiPayload(raw: unknown): FoodScanEstimate {
  if (!raw || typeof raw !== 'object') {
    throwScan('FOOD_NOT_RECOGNIZED', 'Could not recognize a dish', 422);
  }

  const body = raw as {
    recognized?: unknown;
    mealName?: unknown;
    totalCalories?: unknown;
  };

  if (body.recognized === false) {
    throwScan('FOOD_NOT_RECOGNIZED', 'Could not recognize a dish', 422);
  }

  const mealName = typeof body.mealName === 'string' ? body.mealName.trim().slice(0, 120) : '';
  const calories = Number(body.totalCalories);

  if (!mealName || !Number.isFinite(calories)) {
    throwScan('FOOD_NOT_RECOGNIZED', 'Could not recognize a dish', 422);
  }

  const totalCalories = Math.round(calories);
  if (totalCalories < 1 || totalCalories > 10000) {
    throwScan('FOOD_NOT_RECOGNIZED', 'Could not recognize a dish', 422);
  }

  return { mealName, totalCalories };
}

function extractGeminiJson(data: unknown): unknown {
  const text = (
    data as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string' || !text.trim()) {
    throwScan('FOOD_SCAN_FAILED', 'Could not read the photo', 502);
  }

  try {
    return JSON.parse(text);
  } catch {
    throwScan('FOOD_SCAN_FAILED', 'Could not read the photo', 502);
  }
}

async function estimateWithGemini(
  buffer: Buffer,
  mimeType: string,
  locale: AppLocale,
): Promise<FoodScanEstimate> {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throwScan('FOOD_SCAN_UNAVAILABLE', 'Food scan is not connected yet', 503);
  }

  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const language = LANGUAGE_NAME[locale];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

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
              parts: [
                {
                  text: [
                    'Estimate calories for one meal from this photo.',
                    `Reply with JSON only: {"recognized":boolean,"mealName":string,"totalCalories":integer}`,
                    `mealName must be in ${language}, max 80 characters.`,
                    'If there is no food, set recognized to false, mealName to "", totalCalories to 0.',
                    'totalCalories is a typical serving between 1 and 10000.',
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
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throwScan('FOOD_SCAN_FAILED', 'Could not read the photo', 504);
    }
    throwScan('FOOD_SCAN_FAILED', 'Could not read the photo', 502);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throwScan('FOOD_SCAN_UNAVAILABLE', 'Food scan is not connected yet', 503);
    }
    throwScan('FOOD_SCAN_FAILED', 'Could not read the photo', 502);
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  return parseFoodScanAiPayload(extractGeminiJson(payload));
}

export const foodScanService = {
  async scanMeal(userId: string, input: ScanFoodInput, localeHeader?: string | null): Promise<FoodScanEstimate> {
    const entitlement = await getEntitlement(userId);
    if (!entitlement.pro) {
      throwScan('FOOD_SCAN_PRO_REQUIRED', 'Food scan is included in Pro', 403);
    }

    const { buffer, mimeType } = decodeFoodScanImage(input.image, input.mimeType);
    const locale = resolveAppLocale(localeHeader);
    return estimateWithGemini(buffer, mimeType, locale);
  },
};
