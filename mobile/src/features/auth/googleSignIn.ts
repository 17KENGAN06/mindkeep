import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '../../api/auth';

WebBrowser.maybeCompleteAuthSession();

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
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
  const returnUrl = Linking.createURL('google');
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
