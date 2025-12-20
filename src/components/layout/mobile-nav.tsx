'use client';

/**
 * Mobile bottom navigation
 * Fixed bottom nav for mobile devices
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Receipt, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface MobileNavProps {
  onAddClick?: () => void;
}

export function MobileNav({ onAddClick }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navItems = [
    {
      label: t('personal'),
      href: '/',
      icon: Receipt,
    },
    {
      label: t('groups'),
      href: '/groups',
      icon: Users,
    },
  ];

  // Determine active tab based on pathname
  const activeTab = pathname.startsWith('/groups') ? '/groups' : '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Add Button */}
        {onAddClick && (
          <Button
            size="icon"
            className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full shadow-lg"
            onClick={onAddClick}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </nav>
  );
}

