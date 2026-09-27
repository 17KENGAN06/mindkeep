import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../../config/env';

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

export async function requestGoogleSignInCode(): Promise<string> {
  const returnUrl = Linking.createURL('google');
  const startUrl = `${env.apiUrl}/api/auth/google/start?${new URLSearchParams({
    returnUrl,
  }).toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
  if (result.type !== 'success') {
    throw new GoogleSignInCancelledError();
  }

  const code = codeFromUrl(result.url);
  if (!code) {
    throw new Error('Google sign-in did not return a code');
  }

  return code;
}
