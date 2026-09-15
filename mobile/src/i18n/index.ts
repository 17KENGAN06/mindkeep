import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fi from './locales/fi.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const supportedLanguages = [
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
  { code: 'fi', label: 'Suomi' },
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]['code'];

const LANGUAGE_KEY = 'lr_language';
const supportedCodes = supportedLanguages.map((item) => item.code);

function deviceLanguage(): AppLanguage {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  return supportedCodes.includes(tag as AppLanguage) ? (tag as AppLanguage) : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uk: { translation: uk },
    fi: { translation: fi },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: supportedCodes,
  interpolation: { escapeValue: false },
});

export async function hydrateLanguage(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (stored && supportedCodes.includes(stored as AppLanguage)) {
    await i18n.changeLanguage(stored);
    return;
  }
  await i18n.changeLanguage(deviceLanguage());
}

export async function setAppLanguage(code: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
  await i18n.changeLanguage(code);
}

export default i18n;
