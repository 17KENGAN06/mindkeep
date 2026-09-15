import { ApiError } from '../../api/client';

type Translate = (key: string) => string;

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
    case 'MAINTENANCE_ADMIN_ONLY':
      return t('auth.errors.maintenanceAdminOnly');
    case 'CSRF_REJECTED':
      return t('auth.errors.csrf');
    case 'RATE_LIMITED':
      return t('auth.errors.rateLimited');
    case 'VALIDATION_ERROR':
      return t('auth.errors.validation');
    case 'MISSING_TOKEN':
      return t('auth.errors.missingToken');
    default:
      if (error.status === 429) return t('auth.errors.rateLimited');
      if (error.status >= 500) return t('auth.errors.server');
      return error.message?.trim() ? error.message : t('auth.errors.generic');
  }
}
