'use client';

/**
 * App header component
 * Logo, title, and user selector
 */

import { UserSelector } from './user-selector';
import { Wallet } from 'lucide-react';

export function Header() {
  return (
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

        {/* User Selector */}
        <UserSelector />
      </div>
    </header>
  );
}

