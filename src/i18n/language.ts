export type AppLanguage = 'tr' | 'en';

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['tr', 'en'];

/** Language names are always shown in their own language. */
export const LANGUAGE_NATIVE_NAMES: Record<AppLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * 1. A language the user picked manually always wins.
 * 2. Otherwise Turkish devices get Turkish, everything else gets English.
 */
export function resolveInitialLanguage(
  storedLanguage: string | null | undefined,
  deviceLanguageCode: string | null | undefined,
): AppLanguage {
  if (isAppLanguage(storedLanguage)) return storedLanguage;
  return deviceLanguageCode?.toLowerCase() === 'tr' ? 'tr' : 'en';
}
