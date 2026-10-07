import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'mindkeep.access_token';
const REFRESH_KEY = 'mindkeep.refresh_token';

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // Unreadable value (e.g. its Keystore/Keychain key is gone): treat as signed out.
    await SecureStore.deleteItemAsync(key).catch(() => undefined);
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken(): Promise<string | null> {
  return read(ACCESS_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return read(REFRESH_KEY);
}

/**
 * Refresh token first: if the app dies in between, the old access token just gets a 401
 * and the new refresh token recovers the session. The reverse order would strand a rotated refresh token.
 */
export async function setStoredToken(token: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await write(REFRESH_KEY, refreshToken);
  }
  await write(ACCESS_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await remove(ACCESS_KEY);
  await remove(REFRESH_KEY);
}
