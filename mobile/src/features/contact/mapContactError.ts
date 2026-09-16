import { ApiError } from '../../api/client';

type Translate = (key: string) => string;

export function mapContactError(error: unknown, t: Translate): string {
  if (error instanceof TypeError) {
    return t('auth.errors.network');
  }
  if (!(error instanceof ApiError)) {
    return t('contact.errors.generic');
  }
  switch (error.code) {
    case 'BOT_REJECTED':
      return t('contact.errors.generic');
    case 'CONTACT_UNAVAILABLE':
      return t('contact.errors.unavailable');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    case 'VALIDATION_ERROR':
      return t('contact.errors.validation');
    case 'CSRF_REJECTED':
      return t('auth.errors.csrf');
    default:
      if (error.status === 429) return t('auth.errors.rateLimited');
      if (error.status >= 500) return t('contact.errors.unavailable');
      return error.message?.trim() ? error.message : t('contact.errors.generic');
  }
}
