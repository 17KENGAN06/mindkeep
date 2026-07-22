import { ApiError } from '@/api/client';

type Translate = (key: string) => string;

/** Maps API / network failures to a user-facing auth message. */
export function mapAuthError(error: unknown, t: Translate): string {
  if (error instanceof TypeError) {
    return t('auth.errors.network');
  }

  if (!(error instanceof ApiError)) {
    return t('auth.errors.generic');
  }

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return t('auth.errors.invalidCredentials');
    case 'EMAIL_TAKEN':
    case 'REGISTER_FAILED':
      return t('auth.errors.emailTaken');
    case 'INVALID_GOOGLE_CREDENTIAL':
    case 'GOOGLE_ACCOUNT_CONFLICT':
    case 'GOOGLE_AUTH_UNAVAILABLE':
      return t('auth.errors.googleUnavailable');
    case 'BOT_REJECTED':
      return t('auth.bot.rejected');
    case 'CSRF_REJECTED':
      return t('auth.errors.csrf');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    case 'VALIDATION_ERROR':
      return t('auth.errors.validation');
    case 'NOT_FOUND':
      return t('auth.errors.serverOutdated');
    case 'INTERNAL_ERROR':
      return t('auth.errors.server');
    case 'REQUEST_FAILED':
      if (error.status === 0 || error.status >= 500) {
        return t('auth.errors.server');
      }
      if (error.status === 403) {
        return t('auth.errors.csrf');
      }
      if (error.status === 429) {
        return t('auth.errors.rateLimited');
      }
      return error.message || t('auth.errors.generic');
    default:
      if (error.status === 403) {
        return t('auth.errors.csrf');
      }
      if (error.status === 429) {
        return t('auth.errors.rateLimited');
      }
      if (error.status >= 500) {
        return t('auth.errors.server');
      }
      return error.message?.trim() ? error.message : t('auth.errors.generic');
  }
}
