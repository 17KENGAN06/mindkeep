import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.url().default('http://localhost:5173'),
  /** Optional comma-separated extra allowed browser origins (CORS + CSRF). */
  CLIENT_URLS: z.string().optional(),
  DATABASE_URL: z
    .string()
    .min(1)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined)),
  JWT_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().min(8).optional(),
  ENABLE_NODE_CRON: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
  /** Sign in with Apple: token audience (the iOS bundle id). */
  APPLE_BUNDLE_ID: z.string().trim().min(1).default('cloud.mindkeep.app'),
  /** Apple Developer team, Sign in with Apple key id and its .p8 private key (PEM; 
 escapes allowed). Needed to revoke on account deletion. */
  APPLE_TEAM_ID: z.string().trim().optional().transform((value) => value || undefined),
  APPLE_KEY_ID: z.string().trim().optional().transform((value) => value || undefined),
  APPLE_PRIVATE_KEY: z.string().optional().transform((value) => value?.trim() || undefined),
  /** Canonical API origin for Google redirect_uri. Ignored Host header in production. */
  API_PUBLIC_URL: z.url().optional(),
  ADMIN_EMAILS: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean)
        : [],
    ),
  /** App Store / Play review account: this email gets REVIEW_LOGIN_CODE instead of an emailed code. */
  REVIEW_LOGIN_EMAIL: z
    .string()
    .optional()
    .transform((value) => value?.trim().toLowerCase() || undefined),
  /** Fixed 6-digit login code for REVIEW_LOGIN_EMAIL (see config/reviewLogin.ts). */
  REVIEW_LOGIN_CODE: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  /** When true, only ADMIN users may sign in / use the API. */
  MAINTENANCE_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  STRIPE_SECRET_KEY: z.string().trim().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  STRIPE_PRICE_MONTHLY: z.string().trim().min(1).optional(),
  STRIPE_PRICE_YEARLY: z.string().trim().min(1).optional(),
  STRIPE_PRICE_PLUS_MONTHLY: z.string().trim().min(1).optional(),
  STRIPE_PRICE_PLUS_YEARLY: z.string().trim().min(1).optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().trim().min(1).optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().trim().min(1).optional(),
  /** Google AI Studio key. Food scan returns 503 until this is set. */
  GEMINI_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  GEMINI_MODEL: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const envConfig = parsed.data;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function withWwwTwin(origin: string): string[] {
  try {
    const url = new URL(origin);
    const hosts = new Set<string>([url.host]);
    if (url.hostname.startsWith('www.')) {
      hosts.add(url.hostname.slice(4));
    } else {
      hosts.add(`www.${url.hostname}`);
    }
    return [...hosts].map((host) => `${url.protocol}//${host}`);
  } catch {
    return [origin];
  }
}

const baseClientUrl = normalizeOrigin(envConfig.CLIENT_URL);
const extraFromEnv = (envConfig.CLIENT_URLS ?? '')
  .split(',')
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

/** Known production frontends — keeps auth working if CLIENT_URL was left on localhost. */
const knownFrontends =
  envConfig.NODE_ENV === 'production'
    ? ['https://mindkeep.cloud', 'https://www.mindkeep.cloud']
    : [];

export const allowedClientOrigins = [
  ...new Set(
    [baseClientUrl, ...extraFromEnv, ...knownFrontends].flatMap((origin) => withWwwTwin(origin)),
  ),
];

export function isAllowedBrowserOrigin(origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  if (allowedClientOrigins.includes(normalized)) return true;
  if (envConfig.NODE_ENV === 'production') return false;
  try {
    const host = new URL(normalized).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

export const env = {
  ...envConfig,
  CLIENT_URL: baseClientUrl,
  API_PUBLIC_URL:
    envConfig.API_PUBLIC_URL?.replace(/\/$/, '') ||
    (envConfig.NODE_ENV === 'production' ? 'https://api.mindkeep.cloud' : ''),
  allowedClientOrigins,
};

/** Google callback HTML is served from the API origin and POSTs back to /google/finish. */
export function isCanonicalApiOrigin(origin: string): boolean {
  return Boolean(env.API_PUBLIC_URL) && normalizeOrigin(origin) === env.API_PUBLIC_URL;
}

export function assertRequiredSecrets(): void {
  const missing: string[] = [];

  if (!env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!env.CRON_SECRET) missing.push('CRON_SECRET');
    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (env.CRON_SECRET && env.CRON_SECRET.length < 16) {
      throw new Error('CRON_SECRET must be at least 16 characters in production');
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
