/**
 * Internationalization configuration
 */

import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/types/locale';

export const i18nConfig = {
  defaultLocale: DEFAULT_LOCALE,
  locales: SUPPORTED_LOCALES,
} as const;

/**
 * Validate if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get a safe locale (fallback to default if invalid)
 */
export function getSafeLocale(locale: string | undefined | null): Locale {
  if (!locale || !isValidLocale(locale)) {
    return DEFAULT_LOCALE;
  }
  return locale;
}

