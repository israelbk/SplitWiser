/**
 * Locale exports
 * Type-safe access to translation messages
 */

import en from './en.json';
import he from './he.json';
import es from './es.json';
import { Locale } from '@/lib/types/locale';

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  en,
  he,
  es,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en;
}

