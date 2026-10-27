import { env } from '@/config/env.js';

export const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=cloud.mindkeep.app',
  ios: 'https://apps.apple.com/app/id6821462960',
} as const;

type AppVersionConfig = {
  minAndroid: number | undefined;
  latestAndroid: number | undefined;
  minIos: number | undefined;
  latestIos: number | undefined;
};

export type PlatformVersionPolicy = {
  /** Builds below this must update before using the app; null = no requirement. */
  minBuild: number | null;
  /** Newest build in the store; builds below it get a dismissible "update available". */
  latestBuild: number | null;
  storeUrl: string;
};

export type AppVersionPolicy = {
  android: PlatformVersionPolicy;
  ios: PlatformVersionPolicy;
};

function currentConfig(): AppVersionConfig {
  return {
    minAndroid: env.MIN_ANDROID_VERSION_CODE,
    latestAndroid: env.LATEST_ANDROID_VERSION_CODE,
    minIos: env.MIN_IOS_BUILD,
    latestIos: env.LATEST_IOS_BUILD,
  };
}

function platform(min: number | undefined, latest: number | undefined, storeUrl: string): PlatformVersionPolicy {
  const minBuild = min ?? null;
  // A required build is also the newest one the app needs to know about.
  const latestBuild = latest === undefined ? minBuild : Math.max(latest, minBuild ?? 0);
  return { minBuild, latestBuild, storeUrl };
}

/**
 * Store builds the native app compares its own build number (Android versionCode / iOS
 * buildNumber) against at start. Set from Railway env vars; unset = no prompt at all.
 */
export function appVersionPolicy(config = currentConfig()): AppVersionPolicy {
  return {
    android: platform(config.minAndroid, config.latestAndroid, STORE_URLS.android),
    ios: platform(config.minIos, config.latestIos, STORE_URLS.ios),
  };
}
