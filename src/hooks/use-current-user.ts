'use client';

/**
 * Current user hook
 * Integrates with Supabase Auth and provides admin view-as functionality
 */

import { createContext, useContext } from 'react';
import { User } from '@/lib/types';

export interface AuthContextValue {
  /** The authenticated user (from Supabase Auth) */
  authUser: User | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Sign in with Google */
  signIn: () => Promise<void>;
  
  /** Sign out */
  signOut: () => Promise<void>;
  
  /** User being viewed as (admin only, null = viewing as self) */
  viewingAs: User | null;
  
  /** Set the user to view as (admin only) */
  setViewingAs: (user: User | null) => void;
  
  /** Whether currently viewing as another user */
  isViewingAsOther: boolean;
  
  /** The effective user for queries (viewingAs ?? authUser) */
  effectiveUser: User | null;
  
  /** Can perform write actions? (false when viewing as another user) */
  canWrite: boolean;
  
  /** Is the authenticated user an admin? */
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Keep old context name for backward compatibility during transition
export const CurrentUserContext = AuthContext;

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Backward-compatible hook for existing code
 * Returns the effective user (viewed-as user or auth user)
 */
export function useCurrentUser() {
  const auth = useAuth();
  
  return {
    currentUser: auth.effectiveUser,
    setCurrentUser: auth.setViewingAs, // For admin view-as
    isLoading: auth.isLoading,
  };
}

/**
 * Helper hook that throws if no user is authenticated
 */
export function useRequiredCurrentUser(): User {
  const { effectiveUser, isLoading } = useAuth();
  
  if (isLoading) {
    throw new Error('Auth is still loading');
  }
  
  if (!effectiveUser) {
    throw new Error('No user authenticated. Please sign in.');
  }
  
  return effectiveUser;
}
