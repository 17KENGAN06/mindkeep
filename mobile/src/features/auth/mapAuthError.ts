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
    case 'ONBOARDING_REQUIRED':
      return t('onboarding.needOne');
    case 'INVALID_PASSWORD':
      return t('auth.errors.wrongPassword');
    case 'DELETE_FAILED':
      return t('auth.errors.deleteFailed');
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
    case 'GOOGLE_AUTH_UNAVAILABLE':
    case 'INVALID_GOOGLE_CREDENTIAL':
    case 'GOOGLE_ACCOUNT_CONFLICT':
      return t('auth.errors.googleUnavailable');
    case 'GOOGLE_EMAIL_IN_USE':
      return t('auth.errors.googleEmailInUse');
    case 'BOT_REJECTED':
      return t('auth.errors.botRejected');
    case 'EMAIL_UNAVAILABLE':
      return t('auth.errors.emailUnavailable');
    case 'INVALID_LOGIN_CODE':
      return t('auth.errors.invalidLoginCode');
    case 'INVALID_EMAIL_TOKEN':
      return t('auth.errors.invalidEmailToken');
    default:
      if (error.status === 429) return t('auth.errors.rateLimited');
      if (error.status >= 500) return t('auth.errors.server');
      return error.message?.trim() ? error.message : t('auth.errors.generic');
  }
}
