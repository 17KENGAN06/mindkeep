const apiUrl = import.meta.env.VITE_API_URL ?? '';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export const env = {
  apiUrl,
  googleClientId,
  isDev: import.meta.env.DEV,
} as const;
