'use client';

/**
 * Navigation tabs component
 * Tab-based navigation between main sections
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, Users } from 'lucide-react';

const navItems = [
  {
    label: 'Personal',
    href: '/',
    icon: Receipt,
  },
  {
    label: 'Groups',
    href: '/groups',
    icon: Users,
  },
];

export function NavTabs() {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const activeTab = pathname.startsWith('/groups') ? '/groups' : '/';

  return (
    <div className="border-b">
      <div className="container px-4">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="w-full justify-start h-12 bg-transparent p-0 border-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.href;

              return (
                <Link key={item.href} href={item.href} className="flex-1 sm:flex-none">
                  <TabsTrigger
                    value={item.href}
                    className={cn(
                      'w-full sm:w-auto px-4 h-12 rounded-none border-b-2 border-transparent',
                      'data-[state=active]:border-primary data-[state=active]:bg-transparent',
                      'data-[state=active]:shadow-none'
                    )}
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </TabsTrigger>
                </Link>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

