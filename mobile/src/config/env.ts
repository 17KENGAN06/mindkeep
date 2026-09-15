const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mindkeep.cloud').replace(/\/$/, '');

export const env = {
  apiUrl,
} as const;
