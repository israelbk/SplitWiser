'use client';

/**
 * Locale provider component
 * Wraps the app with next-intl's NextIntlClientProvider
 */

import { ReactNode, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Locale, DEFAULT_LOCALE, isRTL } from '@/lib/types/locale';
import { getMessages, Messages } from '@/locales';
import { useCurrentUser } from '@/hooks/use-current-user';

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const { currentUser } = useCurrentUser();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>(getMessages(DEFAULT_LOCALE));
  const [isLoading, setIsLoading] = useState(true);

  // Update locale when user changes or user's language preference changes
  useEffect(() => {
    const userLocale = (currentUser?.language as Locale) || DEFAULT_LOCALE;
    setLocale(userLocale);
    setMessages(getMessages(userLocale));
    setIsLoading(false);
  }, [currentUser?.language]);

  // Update HTML attributes when locale changes
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', isRTL(locale) ? 'rtl' : 'ltr');
  }, [locale]);

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

