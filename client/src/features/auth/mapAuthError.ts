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
    case 'INVALID_PASSWORD':
      return t('auth.errors.wrongPassword');
    case 'DELETE_FAILED':
      return t('auth.errors.deleteFailed');
    case 'INVALID_CREDENTIALS':
      return t('auth.errors.invalidCredentials');
    case 'EMAIL_TAKEN':
    case 'REGISTER_FAILED':
      return t('auth.errors.emailTaken');
    case 'INVALID_GOOGLE_CREDENTIAL':
    case 'GOOGLE_ACCOUNT_CONFLICT':
    case 'GOOGLE_AUTH_UNAVAILABLE':
      return t('auth.errors.googleUnavailable');
    case 'GOOGLE_EMAIL_IN_USE':
      return t('auth.errors.googleEmailInUse');
    case 'EMAIL_UNAVAILABLE':
      return t('auth.errors.emailUnavailable');
    case 'INVALID_LOGIN_CODE':
      return t('auth.errors.invalidLoginCode');
    case 'ONBOARDING_REQUIRED':
      return t('onboarding.needOne');
    case 'INVALID_EMAIL_TOKEN':
      return t('auth.errors.invalidEmailToken');
    case 'BOT_REJECTED':
      return t('auth.bot.rejected');
    case 'MAINTENANCE_ADMIN_ONLY':
      return t('auth.errors.maintenanceAdminOnly');
    case 'CSRF_REJECTED':
      return t('auth.errors.csrf');
    case 'PLAN_LIMIT':
      return t('billing.limitReached');
    case 'FOOD_SCAN_UNAVAILABLE':
      return t('calories.scan.errors.unavailable');
    case 'FOOD_SCAN_PRO_REQUIRED':
      return t('calories.scan.errors.proRequired');
    case 'FOOD_NOT_RECOGNIZED':
      return t('calories.scan.errors.notRecognized');
    case 'FOOD_SCAN_TOO_LARGE':
      return t('calories.scan.errors.tooLarge');
    case 'FOOD_SCAN_BAD_TYPE':
      return t('calories.scan.errors.badType');
    case 'FOOD_SCAN_INVALID':
      return t('calories.scan.errors.invalid');
    case 'FOOD_SCAN_FAILED':
      return t('calories.scan.errors.failed');
    case 'BILLING_UNAVAILABLE':
    case 'BILLING_PORTAL_UNAVAILABLE':
      return t('billing.unavailable');
    case 'ALREADY_PRO':
      return t('billing.alreadyPro');
    case 'BILLING_CUSTOMER_MISSING':
      return t('billing.customerMissing');
    case 'NO_SUBSCRIPTION':
      return t('billing.noSubscription');
    case 'SAME_PLAN':
      return t('billing.samePlan');
    case 'CANCEL_PENDING':
      return t('billing.cancelBeforeChange');
    case 'CHANGE_UNAVAILABLE':
      return t('billing.changeUnavailable');
    case 'STRIPE_CHECKOUT_FAILED':
    case 'STRIPE_SESSION_MISMATCH':
      return t('billing.checkoutFailed');
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
