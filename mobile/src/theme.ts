export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  bg: string;
  panel: string;
  line: string;
  ink: string;
  muted: string;
  brand: string;
  onBrand: string;
  danger: string;
  warn: string;
};

export const palettes: Record<ThemeMode, ColorTokens> = {
  dark: {
    bg: '#07110d',
    panel: '#0d1c16',
    line: '#1e3a2f',
    ink: '#e8f6ee',
    muted: '#8aa396',
    brand: '#8eefb4',
    onBrand: '#07110d',
    danger: '#f87171',
    warn: '#fbbf24',
  },
  light: {
    bg: '#dfe6e2',
    panel: '#e8eeea',
    line: '#c2cdc7',
    ink: '#243029',
    muted: '#5a6b63',
    brand: '#356f58',
    onBrand: '#f4faf7',
    danger: '#dc2626',
    warn: '#d97706',
  },
};

/** Fallback for the boot splash before ThemeProvider mounts. */
export const colors = palettes.dark;
