'use client';

/**
 * View-as hook for admin impersonation
 * Allows admins to view the app as another user (read-only)
 */

import { createContext, useContext } from 'react';
import { User } from '@/lib/types';

export interface ViewAsContextValue {
  /** The user being viewed as (null = viewing as self) */
  viewingAs: User | null;
  /** Set the user to view as (null to clear) */
  setViewingAs: (user: User | null) => void;
  /** Whether currently viewing as another user */
  isViewingAsOther: boolean;
}

export const ViewAsContext = createContext<ViewAsContextValue | null>(null);

export function useViewAs(): ViewAsContextValue {
  const context = useContext(ViewAsContext);
  
  if (!context) {
    throw new Error('useViewAs must be used within a ViewAsProvider');
  }
  
  return context;
}

