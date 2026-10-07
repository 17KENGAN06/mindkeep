import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { AppError } from '@/utils/AppError.js';
import {
  decodeGoogleOAuthState,
  encodeState,
  hashFlowSecret,
  isSafeAppReturnUrl,
  returnUrlScheme,
  ticketLookupHash,
} from '@/services/googleOAuth.service.js';

// Pure checks only — nothing here touches the database.

describe('Google sign-in return URLs', () => {
  test('production only returns to the installed app', () => {
    assert.equal(isSafeAppReturnUrl('mindkeep://google', true), true);
    assert.equal(isSafeAppReturnUrl('exp://attacker.exp.direct/--/google', true), false);
    assert.equal(isSafeAppReturnUrl('exps://u.expo.dev/--/google', true), false);
    assert.equal(isSafeAppReturnUrl('exp://192.168.1.5:8081/--/google', true), false);
    assert.equal(isSafeAppReturnUrl('https://evil.example/google', true), false);
  });

  // What the mobile app sends (features/auth/googleSignIn.ts pins the "mindkeep" scheme).
  test('production accepts the installed app in both URL forms, never the package-name scheme', () => {
    assert.equal(isSafeAppReturnUrl('mindkeep:///google', true), true);
    // expo-linking falls back to the Android package name when a build has no scheme.
    assert.equal(isSafeAppReturnUrl('cloud.mindkeep.app://google', true), false);
    // Expo Go on the LAN, as createURL builds it.
    assert.equal(isSafeAppReturnUrl('exp://192.168.8.66:8081/--/google', true), false);
  });

  test('refused return URLs are logged by scheme only', () => {
    assert.equal(returnUrlScheme('exp://192.168.8.66:8081/--/google'), 'exp:');
    assert.equal(returnUrlScheme('cloud.mindkeep.app://google'), 'cloud.mindkeep.app:');
    assert.equal(returnUrlScheme('not a url'), 'unparseable');
  });

  test('development still allows Expo Go and tunnel URLs', () => {
    assert.equal(isSafeAppReturnUrl('mindkeep://google', false), true);
    assert.equal(isSafeAppReturnUrl('exp://192.168.1.5:8081/--/google', false), true);
    assert.equal(isSafeAppReturnUrl('exp://abc.exp.direct/--/google', false), true);
    assert.equal(isSafeAppReturnUrl('https://evil.example/google', false), false);
  });
});

describe('Google sign-in flow secret', () => {
  const secret = 'a'.repeat(43);
  const otherSecret = 'b'.repeat(43);

  test('the secret hash is base64url SHA-256', () => {
    assert.match(hashFlowSecret(secret), /^[A-Za-z0-9_-]{43}$/);
  });

  test('a code only resolves with the secret that started the flow', () => {
    const code = 'one-time-code-0123456789';
    const issued = ticketLookupHash(code, hashFlowSecret(secret));
    assert.equal(ticketLookupHash(code, hashFlowSecret(secret)), issued);
    assert.notEqual(ticketLookupHash(code, hashFlowSecret(otherSecret)), issued);
    assert.notEqual(ticketLookupHash(code), issued);
  });

  test('state round-trips the secret hash', () => {
    const ch = hashFlowSecret(secret);
    const state = encodeState({ returnUrl: 'mindkeep://google', nonce: 'n', iat: Date.now(), ch });
    assert.equal(decodeGoogleOAuthState(state).ch, ch);
  });

  test('tampered state or malformed hash is rejected', () => {
    const ch = hashFlowSecret(secret);
    const state = encodeState({ returnUrl: 'mindkeep://google', nonce: 'n', iat: Date.now(), ch });
    const [payload] = state.split('.');
    const isAuthError = (error: unknown) => error instanceof AppError && error.statusCode === 400;

    assert.throws(() => decodeGoogleOAuthState(`${payload}.forged`), isAuthError);

    const badHash = encodeState({
      returnUrl: 'mindkeep://google',
      nonce: 'n',
      iat: Date.now(),
      ch: 'not-a-hash',
    });
    assert.throws(() => decodeGoogleOAuthState(badHash), isAuthError);
  });
});
