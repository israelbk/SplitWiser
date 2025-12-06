'use client';

/**
 * Current user hook
 * For POC: Uses context for mock user selection
 * Future: Will integrate with Supabase Auth
 */

import { createContext, useContext } from 'react';
import { User } from '@/lib/types';

export interface CurrentUserContextValue {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
}

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  
  return context;
}

/**
 * Helper hook that throws if no user is selected
 */
export function useRequiredCurrentUser(): User {
  const { currentUser } = useCurrentUser();
  
  if (!currentUser) {
    throw new Error('No user selected. Please select a user first.');
  }
  
  return currentUser;
}

