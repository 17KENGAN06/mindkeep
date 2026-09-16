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

function credentialFromUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const fromQuery = parsed.queryParams?.credential;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) {
    return fromQuery;
  }

  const hash = url.split('#')[1];
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('credential') ?? params.get('id_token');
}

export async function requestGoogleIdToken(): Promise<string> {
  const returnUrl = Linking.createURL('google');
  const startUrl = `${env.apiUrl}/api/auth/google/start?${new URLSearchParams({
    returnUrl,
  }).toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
  if (result.type !== 'success') {
    throw new GoogleSignInCancelledError();
  }

  const credential = credentialFromUrl(result.url);
  if (!credential) {
    throw new Error('Google sign-in did not return a credential');
  }

  return credential;
}
