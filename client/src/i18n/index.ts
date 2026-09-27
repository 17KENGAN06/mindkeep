import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fi from '@/i18n/locales/fi.json';
import fr from '@/i18n/locales/fr.json';
import it from '@/i18n/locales/it.json';
import pl from '@/i18n/locales/pl.json';
import ru from '@/i18n/locales/ru.json';
import uk from '@/i18n/locales/uk.json';

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

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uk: { translation: uk },
      ru: { translation: ru },
      en: { translation: en },
      pl: { translation: pl },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      es: { translation: es },
      fi: { translation: fi },
    },
    fallbackLng: 'en',
    supportedLngs: ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'fi'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lr_language',
    },
  });

function syncDocumentLang(code: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code.split('-')[0] || 'en';
}

syncDocumentLang(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', syncDocumentLang);

export default i18n;
