import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

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

// v2: earlier builds saved every pick for good; starting over makes everyone follow the phone again.
const LANGUAGE_KEY = 'lr_language_v2';
const supportedCodes = supportedLanguages.map((item) => item.code);

function deviceLanguage(): AppLanguage {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  return supportedCodes.includes(tag as AppLanguage) ? (tag as AppLanguage) : 'en';
}

void i18n.use(initReactI18next).init({
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
  lng: deviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: supportedCodes,
  interpolation: { escapeValue: false },
});

/** True while the app follows the phone's language (no manual pick saved). */
let followingSystem = true;

export function isSystemLanguage(): boolean {
  return followingSystem;
}

export async function hydrateLanguage(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (stored && supportedCodes.includes(stored as AppLanguage)) {
    followingSystem = false;
    await i18n.changeLanguage(stored);
    return;
  }
  followingSystem = true;
  await i18n.changeLanguage(deviceLanguage());
}

/** 'system' forgets the manual pick and goes back to the phone's language. */
export async function setAppLanguage(code: AppLanguage | 'system'): Promise<void> {
  if (code === 'system') {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    followingSystem = true;
    await i18n.changeLanguage(deviceLanguage());
    return;
  }
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
  followingSystem = false;
  await i18n.changeLanguage(code);
}

export default i18n;
