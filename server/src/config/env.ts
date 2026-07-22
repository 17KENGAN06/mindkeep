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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

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

const baseClientUrl = normalizeOrigin(parsed.data.CLIENT_URL);
const extraFromEnv = (parsed.data.CLIENT_URLS ?? '')
  .split(',')
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

/** Known production frontends — keeps auth working if CLIENT_URL was left on localhost. */
const knownFrontends =
  parsed.data.NODE_ENV === 'production'
    ? ['https://mindkeep.cloud', 'https://www.mindkeep.cloud']
    : [];

export const allowedClientOrigins = [
  ...new Set(
    [baseClientUrl, ...extraFromEnv, ...knownFrontends].flatMap((origin) => withWwwTwin(origin)),
  ),
];

export const env = {
  ...parsed.data,
  CLIENT_URL: baseClientUrl,
  allowedClientOrigins,
};

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
