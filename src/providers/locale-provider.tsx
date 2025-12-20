'use client';

/**
 * Locale provider component
 * Wraps the app with next-intl's NextIntlClientProvider
 * 
 * Supports optimistic locale updates via custom event for instant UI response
 */

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Locale, DEFAULT_LOCALE, isRTL } from '@/lib/types/locale';
import { getMessages, Messages } from '@/locales';
import { useCurrentUser } from '@/hooks/use-current-user';

// Custom event name for optimistic locale updates
export const LOCALE_CHANGE_EVENT = 'splitwiser:locale-change';

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const { currentUser } = useCurrentUser();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>(getMessages(DEFAULT_LOCALE));
  const [isLoading, setIsLoading] = useState(true);

  // Handle locale change (both from user data and optimistic updates)
  const updateLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setMessages(getMessages(newLocale));
    
    // Update HTML attributes immediately
    const html = document.documentElement;
    html.setAttribute('lang', newLocale);
    html.setAttribute('dir', isRTL(newLocale) ? 'rtl' : 'ltr');
  }, []);

  // Update locale when user changes or user's language preference changes
  useEffect(() => {
    const userLocale = (currentUser?.language as Locale) || DEFAULT_LOCALE;
    updateLocale(userLocale);
    setIsLoading(false);
  }, [currentUser?.language, updateLocale]);

  // Listen for optimistic locale change events
  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent<Locale>) => {
      updateLocale(event.detail);
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);
    };
  }, [updateLocale]);

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Jerusalem"
    >
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Dispatch optimistic locale change event
 * Call this immediately when user changes language for instant UI update
 */
export function dispatchLocaleChange(locale: Locale) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: locale }));
  }
}

