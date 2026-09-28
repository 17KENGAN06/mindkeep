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
  return SecureStore.getItemAsync(key);
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

export async function setStoredToken(token: string, refreshToken?: string): Promise<void> {
  await write(ACCESS_KEY, token);
  if (refreshToken) {
    await write(REFRESH_KEY, refreshToken);
  }
}

export async function clearStoredToken(): Promise<void> {
  await remove(ACCESS_KEY);
  await remove(REFRESH_KEY);
}
