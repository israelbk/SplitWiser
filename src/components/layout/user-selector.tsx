'use client';

/**
 * User selector component
 * Dropdown to switch between mock users (POC)
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
import { useCurrentUser } from '@/hooks/use-current-user';
import { useUsers } from '@/hooks/queries';
import { UserAvatar } from '@/components/common';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function UserSelector() {
  const { currentUser, setCurrentUser, isLoading: userLoading } = useCurrentUser();
  const { data: users, isLoading: usersLoading } = useUsers();

  if (userLoading || usersLoading) {
    return <Skeleton className="h-9 w-32" />;
  }

  if (!currentUser) {
    return (
      <Button variant="outline" size="sm" disabled>
        <UserIcon className="h-4 w-4 mr-2" />
        No user
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserAvatar user={currentUser} size="sm" />
          <span className="max-w-[100px] truncate">{currentUser.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users?.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setCurrentUser(user)}
            className="gap-2"
          >
            <UserAvatar user={user} size="sm" />
            <span className="truncate">{user.name}</span>
            {user.id === currentUser.id && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

