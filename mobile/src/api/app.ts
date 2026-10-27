import { apiClient } from './client';

export type PlatformVersionPolicy = {
  /** Builds below this must update before using the app; null = no requirement. */
  minBuild: number | null;
  /** Newest store build; builds below it get a dismissible "update available". */
  latestBuild: number | null;
  storeUrl: string;
};

export type AppVersionPolicy = {
  android: PlatformVersionPolicy;
  ios: PlatformVersionPolicy;
};

export const appApi = {
  version: () => apiClient.get<AppVersionPolicy>('/api/app/version'),
};
