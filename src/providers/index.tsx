'use client';

/**
 * Combined providers
 * Wraps all context providers for the app
 */

import { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { UserProvider } from './user-provider';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <UserProvider>
        <AuthGuard>
          {children}
        </AuthGuard>
        <Toaster position="top-center" />
      </UserProvider>
    </QueryProvider>
  );
}

// Re-export individual providers
export { QueryProvider } from './query-provider';
export { UserProvider } from './user-provider';

