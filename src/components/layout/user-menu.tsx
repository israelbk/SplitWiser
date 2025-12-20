'use client';

/**
 * User menu component
 * Shows current user with sign out option
 * For non-admin users
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-current-user';
import { UserAvatar } from '@/components/common';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function UserMenu() {
  const { authUser, isLoading, signOut, isAdmin } = useAuth();

  if (isLoading) {
    return <Skeleton className="h-9 w-32" />;
  }

  if (!authUser) {
    return (
      <Button variant="outline" size="sm" disabled>
        <UserIcon className="h-4 w-4 mr-2" />
        Not signed in
      </Button>
    );
  }

  // Admins use the AdminUserSwitcher instead
  if (isAdmin) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserAvatar user={authUser} size="sm" />
          <span className="max-w-[100px] truncate">{authUser.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{authUser.name}</p>
            {authUser.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {authUser.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
          <span className="ms-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

