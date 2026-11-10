import i18n, { type BackendModule } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Each language is its own chunk, so a visitor downloads only theirs (plus English as fallback).
const loaders = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json');

const lazyLocales: BackendModule = {
  type: 'backend',
  init() {},
  read(language, _namespace, callback) {
    const load = loaders[`./locales/${language}.json`];
    if (!load) {
      callback(new Error(`No locale ${language}`), false);
      return;
    }
    load().then(
      (module) => callback(null, module.default),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error)), false),
    );
  },
};

export const supportedLanguages = [
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'fi', label: 'Suomi' },
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]['code'];

/** Resolves once the active language (and the English fallback) is loaded; render after it. */
export const i18nReady = i18n
  .use(lazyLocales)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'fi'],
    interpolation: {
      escapeValue: false,
    },
    // Languages arrive before the first render (see main.tsx), so components never suspend.
    react: { useSuspense: false },
    detection: {
      // Public pages carry the language in the URL (`/ru/blog`); it wins and is saved.
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
      lookupLocalStorage: 'lr_language',
    },
  });

function syncDocumentLang(code: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code.split('-')[0] || 'en';
}

i18n.on('languageChanged', syncDocumentLang);
void i18nReady.then(() => syncDocumentLang(i18n.resolvedLanguage ?? i18n.language));

export default i18n;
