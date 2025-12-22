'use client';

/**
 * App header component
 * Logo, title, user menu/admin switcher, and settings
 */

import { AdminUserSwitcher } from './admin-user-switcher';
import { UserMenu } from './user-menu';
import { SettingsSheet } from './settings-sheet';
import { useAuth } from '@/hooks/use-current-user';
import { Wallet, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Header() {
  const { isAdmin, isViewingAsOther, viewingAs, canWrite, authUser } = useAuth();
  const t = useTranslations('header');

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto flex h-14 items-center px-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">{t('title')}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Only show controls when authenticated */}
          {authUser && (
            <div className="flex items-center gap-1">
              {/* Settings (theme, language, currency) */}
              <SettingsSheet />

              {/* Separator */}
              <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />

              {/* User Menu - for admins show switcher, for regular users show simple menu */}
              {isAdmin ? <AdminUserSwitcher /> : <UserMenu />}
            </div>
          )}
        </div>
      </header>

      {/* View-as banner for admins */}
      {isViewingAsOther && (
        <div className="sticky top-14 z-40 bg-warning/10 border-b border-warning/20 overflow-x-hidden">
          <div className="w-full max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-warning flex-shrink-0" />
              <p className="text-warning-foreground">
                <span className="font-medium">{t('viewOnlyMode')}</span> {t('viewingAs')}{' '}
                <span className="font-semibold">{viewingAs?.name}</span>.
                {!canWrite && ` ${t('actionsDisabled')}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
