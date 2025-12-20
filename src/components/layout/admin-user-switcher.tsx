'use client';

/**
 * Admin user switcher component
 * Allows admins to view the app as another user (read-only)
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-current-user';
import { useUsers } from '@/hooks/queries';
import { UserAvatar } from '@/components/common';
import { Eye, User as UserIcon, ArrowLeft, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminUserSwitcher() {
  const { 
    authUser, 
    effectiveUser, 
    viewingAs, 
    setViewingAs, 
    isViewingAsOther,
    isAdmin,
    isLoading: authLoading,
    signOut,
  } = useAuth();
  const { data: users, isLoading: usersLoading } = useUsers();

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  if (authLoading || usersLoading) {
    return <Skeleton className="h-9 w-36" />;
  }

  if (!authUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isViewingAsOther ? "secondary" : "outline"} 
          size="icon"
          className={`h-9 w-9 rounded-full p-0 relative ${isViewingAsOther ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background' : ''}`}
        >
          <UserAvatar user={effectiveUser!} size="sm" />
          {isViewingAsOther && (
            <Eye className="absolute -bottom-0.5 -end-0.5 h-4 w-4 text-amber-500 bg-background rounded-full p-0.5" />
          )}
          <span className="sr-only">{effectiveUser?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isViewingAsOther ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Eye className="h-4 w-4" />
              Viewing as {viewingAs?.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setViewingAs(null)}
              className="gap-2 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to my account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              View as User (Admin)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {/* List all users */}
        <div className="max-h-64 overflow-y-auto">
          {users?.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => {
                if (user.id === authUser.id) {
                  setViewingAs(null);
                } else {
                  setViewingAs(user);
                }
              }}
              className="gap-2"
            >
              <UserAvatar user={user} size="sm" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">{user.name}</span>
                {user.email && (
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                )}
              </div>
              {user.id === authUser.id && (
                <Badge variant="outline" className="ms-auto text-xs">
                  You
                </Badge>
              )}
              {user.id === effectiveUser?.id && user.id !== authUser.id && (
                <span className="ms-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </div>

        {(!users || users.length === 0) && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No users found
          </div>
        )}

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

