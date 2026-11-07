import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import { preferencesStorage } from '@/lib/storage';
import { StorageKeys } from '@/lib/storage-keys';

import { isAppLanguage, resolveInitialLanguage, type AppLanguage } from './language';
import en from './locales/en';
import tr from './locales/tr';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
} as const;

function detectDeviceLanguage(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    return null;
  }
}

const initialLanguage = resolveInitialLanguage(
  preferencesStorage.getString(StorageKeys.language),
  detectDeviceLanguage(),
);

const i18n = createInstance();

// Resources are bundled, so initialization completes synchronously.
void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['tr', 'en'],
  interpolation: { escapeValue: false }, // React already escapes output
  react: { useSuspense: false },
});

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  preferencesStorage.setString(StorageKeys.language, language);
  await i18n.changeLanguage(language);
}

export function useAppLanguage() {
  const { i18n: instance } = useTranslation();
  const current = instance.resolvedLanguage ?? instance.language;
  return {
    language: (isAppLanguage(current) ? current : 'en') as AppLanguage,
    setLanguage: setAppLanguage,
  };
}

export { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES, type AppLanguage } from './language';
export default i18n;
