import { useTranslation } from 'react-i18next';
import { supportedLanguages, type AppLanguage } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as AppLanguage;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="sr-only">{t('common.language')}</span>
      <select
        className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        value={current}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
        aria-label={t('common.language')}
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
