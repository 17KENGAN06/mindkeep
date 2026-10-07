import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../../api/auth';
import { env } from '../../config/env';

WebBrowser.maybeCompleteAuthSession();

/** The installed app's deep-link scheme (`scheme` in app.json). Production only returns here. */
const APP_SCHEME = 'mindkeep';
const PRODUCTION_API = 'https://api.mindkeep.cloud';

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

/** Expo Go (exp://…) against the production API: the server refuses that return address. */
export class GoogleSignInNeedsAppError extends Error {
  constructor() {
    super('Google sign-in needs the installed app');
    this.name = 'GoogleSignInNeedsAppError';
  }
}

/**
 * Where Google sends the user back: mindkeep://google in the installed app. Expo Go returns
 * exp://…, which only a non-production API accepts, so fail early there with a clear message
 * instead of a generic "Google sign-in failed" from the server.
 */
export function googleReturnUrl(): string {
  const returnUrl = Linking.createURL('google');
  if (!returnUrl.startsWith(`${APP_SCHEME}:`) && env.apiUrl === PRODUCTION_API) {
    throw new GoogleSignInNeedsAppError();
  }
  return returnUrl;
}

function codeFromUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const fromQuery = parsed.queryParams?.code;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) {
    return fromQuery;
  }

  const hash = url.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('code');
}

/**
 * The flow secret comes from the API over HTTPS and never passes through the browser,
 * so a code delivered anywhere else cannot be redeemed without it.
 */
export async function requestGoogleSignInCode(): Promise<{ code: string; flowSecret: string }> {
  const returnUrl = googleReturnUrl();
  const { authorizeUrl, flowSecret } = await authApi.googleMobileStart(returnUrl);

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, returnUrl);
  if (result.type !== 'success') {
    throw new GoogleSignInCancelledError();
  }

  const code = codeFromUrl(result.url);
  if (!code) {
    throw new Error('Google sign-in did not return a code');
  }

  return { code, flowSecret };
}
