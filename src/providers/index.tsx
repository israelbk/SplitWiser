'use client';

/**
 * Combined providers
 * Wraps all context providers for the app
 */

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from './query-provider';
import { UserProvider } from './user-provider';
import { LocaleProvider } from './locale-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <UserProvider>
          <LocaleProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster position="top-center" />
          </LocaleProvider>
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// Re-export individual providers
export { QueryProvider } from './query-provider';
export { UserProvider } from './user-provider';
export { LocaleProvider } from './locale-provider';

