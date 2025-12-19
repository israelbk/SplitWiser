'use client';

/**
 * App header component
 * Logo, title, user menu/admin switcher, and currency settings
 */

import { AdminUserSwitcher } from './admin-user-switcher';
import { UserMenu } from './user-menu';
import { CurrencySelector } from './currency-selector';
import { useAuth } from '@/hooks/use-current-user';
import { Wallet, Eye } from 'lucide-react';

export function Header() {
  const { isAdmin, isViewingAsOther, viewingAs, canWrite, authUser } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">SplitWiser</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Only show controls when authenticated */}
          {authUser && (
            <>
              {/* Currency Selector */}
              <CurrencySelector />

              {/* Separator */}
              <div className="h-6 w-px bg-border mx-2" />

              {/* User Menu - for admins show switcher, for regular users show simple menu */}
              {isAdmin ? <AdminUserSwitcher /> : <UserMenu />}
            </>
          )}
        </div>
      </header>

      {/* View-as banner for admins */}
      {isViewingAsOther && (
        <div className="sticky top-14 z-40 bg-amber-500/10 border-b border-amber-500/20">
          <div className="container px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-amber-700 dark:text-amber-300">
                <span className="font-medium">View-only mode:</span> You are viewing as{' '}
                <span className="font-semibold">{viewingAs?.name}</span>.
                {!canWrite && ' Actions are disabled while viewing another user.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
