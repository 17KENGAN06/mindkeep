import { env } from '@/config/env.js';

const CODE_PATTERN = /^\d{6}$/;

type ReviewLoginConfig = {
  email: string | undefined;
  code: string | undefined;
  adminEmails: string[];
};

function currentConfig(): ReviewLoginConfig {
  return { email: env.REVIEW_LOGIN_EMAIL, code: env.REVIEW_LOGIN_CODE, adminEmails: env.ADMIN_EMAILS };
}

/** Why the review login is off despite being configured, or null when it is fine or unset. */
export function reviewLoginConfigProblem(config = currentConfig()): string | null {
  if (!config.email && !config.code) return null;
  if (!config.email || !config.code) return 'set both REVIEW_LOGIN_EMAIL and REVIEW_LOGIN_CODE';
  if (!CODE_PATTERN.test(config.code)) return 'REVIEW_LOGIN_CODE must be exactly 6 digits';
  if (config.adminEmails.includes(config.email)) return 'REVIEW_LOGIN_EMAIL must not be an admin email';
  return null;
}

/**
 * App Store / Google Play review access. App reviewers cannot read the emailed login code, so
 * one dedicated non-admin account gets a fixed code instead. The password is still required,
 * and the code keeps the normal expiry, attempt limit and rate limits. Unset the env vars to
 * turn it off.
 */
export function reviewLoginCodeFor(email: string, config = currentConfig()): string | null {
  if (reviewLoginConfigProblem(config) !== null || !config.email || !config.code) return null;
  return email.trim().toLowerCase() === config.email ? config.code : null;
}
