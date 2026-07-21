const apiUrl = import.meta.env.VITE_API_URL ?? '';

export const env = {
  apiUrl,
  isDev: import.meta.env.DEV,
} as const;
