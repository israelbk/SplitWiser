'use client';

/**
 * User provider for mock user selection
 * POC: Allows switching between mock users
 * Future: Will integrate with Supabase Auth
 */

import { ReactNode, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { CurrentUserContext } from '@/hooks/use-current-user';
import { User } from '@/lib/types';
import { useUsers } from '@/hooks/queries';

const STORAGE_KEY = 'splitwiser-current-user-id';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: users, isLoading: usersLoading } = useUsers();
  const hasInitialized = useRef(false);

  // Load saved user ID from localStorage only once when users are first available
  useEffect(() => {
    // Only run once when users become available
    if (hasInitialized.current || !users || users.length === 0) {
      return;
    }

    hasInitialized.current = true;
    
    const savedUserId = localStorage.getItem(STORAGE_KEY);
    
    if (savedUserId) {
      const user = users.find((u) => u.id === savedUserId);
      if (user) {
        setCurrentUserState(user);
      } else {
        // Saved user not found, default to first user
        setCurrentUserState(users[0]);
        localStorage.setItem(STORAGE_KEY, users[0].id);
      }
    } else {
      // No saved user, default to first user
      setCurrentUserState(users[0]);
      localStorage.setItem(STORAGE_KEY, users[0].id);
    }
    
    setIsInitialized(true);
  }, [users]);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, user.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isLoading = usersLoading || (!isInitialized && !hasInitialized.current);

  const contextValue = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isLoading,
  }), [currentUser, setCurrentUser, isLoading]);

  return (
    <CurrentUserContext.Provider value={contextValue}>
      {children}
    </CurrentUserContext.Provider>
  );
}

