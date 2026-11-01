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
  expense: string;
};

/** The website's tokens (client/src/index.css). Keep both in step. */
export const palettes: Record<ThemeMode, ColorTokens> = {
  dark: {
    bg: '#090c0e',
    panel: '#11161a',
    line: '#ffffff14',
    ink: '#f5f7f6',
    muted: '#8f9a9c',
    brand: '#82f0be',
    onBrand: '#07110d',
    danger: '#f87171',
    warn: '#fbbf24',
    expense: '#d9a441',
  },
  light: {
    bg: '#fafbfb',
    panel: '#ffffff',
    line: '#10141617',
    ink: '#101416',
    muted: '#646f72',
    brand: '#0b7a55',
    onBrand: '#ffffff',
    danger: '#dc2626',
    warn: '#d97706',
    expense: '#8b5a12',
  },
};

/** Fallback for the boot splash before ThemeProvider mounts. */
export const colors = palettes.dark;
