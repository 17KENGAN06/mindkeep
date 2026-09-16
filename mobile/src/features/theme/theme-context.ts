import { createContext } from 'react';
import type { ColorTokens, ThemeMode } from '../../theme';

export type ThemeContextValue = {
  theme: ThemeMode;
  colors: ColorTokens;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

export const THEME_STORAGE_KEY = 'lr_theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
