'use client';

/**
 * App shell component
 * Main layout wrapper with header and navigation
 */

import { ReactNode } from 'react';
import { Header } from './header';
import { NavTabs } from './nav-tabs';
import { MobileNav } from './mobile-nav';

interface AppShellProps {
  children: ReactNode;
  onAddClick?: () => void;
}

export function AppShell({ children, onAddClick }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block">
        <NavTabs />
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-20 sm:pb-4">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav onAddClick={onAddClick} />
    </div>
  );
}

