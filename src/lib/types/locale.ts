/**
 * Locale types for internationalization
 */

export type Locale = 'en' | 'he' | 'es';

export type Direction = 'ltr' | 'rtl';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: Direction;
  flag: string;
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    direction: 'rtl',
    flag: '🇮🇱',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flag: '🇪🇸',
  },
};

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'he', 'es'];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return LOCALES[locale]?.direction === 'rtl';
}

/**
 * Get locale info by code
 */
export function getLocaleInfo(locale: Locale): LocaleInfo {
  return LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];
}

