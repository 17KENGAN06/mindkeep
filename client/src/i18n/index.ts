import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en.json';
import fi from '@/i18n/locales/fi.json';
import ru from '@/i18n/locales/ru.json';
import uk from '@/i18n/locales/uk.json';

export const supportedLanguages = [
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
  { code: 'fi', label: 'Suomi' },
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]['code'];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uk: { translation: uk },
      fi: { translation: fi },
    },
    fallbackLng: 'en',
    supportedLngs: ['ru', 'uk', 'en', 'fi'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lr_language',
    },
  });

export default i18n;
