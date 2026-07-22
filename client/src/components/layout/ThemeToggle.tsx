import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/features/theme/useTheme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-ink transition hover:border-brand-400 hover:text-brand-400"
      aria-label={isDark ? t('common.themeLight') : t('common.themeDark')}
      title={isDark ? t('common.themeLight') : t('common.themeDark')}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
