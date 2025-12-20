/**
 * Language preferences query hooks
 * 
 * Uses optimistic updates for instant UI response when changing language.
 * The locale change happens immediately via custom event, while DB persists in background.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { userService } from '@/lib/services';
import { Locale, DEFAULT_LOCALE } from '@/lib/types';
import { useCurrentUser } from '../use-current-user';
import { dispatchLocaleChange, LOCALE_CHANGE_EVENT } from '@/providers/locale-provider';

/**
 * Hook to get current user's language preference
 */
export function useLanguage(): Locale {
  const { currentUser } = useCurrentUser();
  return (currentUser?.language as Locale) ?? DEFAULT_LOCALE;
}

/**
 * Hook to get language settings with optimistic updates
 * Returns the optimistic language (instant) rather than waiting for DB
 */
export function useLanguageSettings() {
  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  
  // Track optimistic language locally for instant UI updates
  const [optimisticLanguage, setOptimisticLanguage] = useState<Locale>(
    (currentUser?.language as Locale) ?? DEFAULT_LOCALE
  );
  
  // Sync with server state when user data changes (after mutation completes)
  useEffect(() => {
    if (currentUser?.language) {
      setOptimisticLanguage(currentUser.language as Locale);
    }
  }, [currentUser?.language]);
  
  // Also listen to locale change events (for cross-component sync)
  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent<Locale>) => {
      setOptimisticLanguage(event.detail);
    };
    
    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange as EventListener);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (language: Locale) => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      return userService.setLanguage(currentUser.id, language);
    },
    onMutate: (language) => {
      // Optimistic update: update local state AND dispatch event immediately
      setOptimisticLanguage(language);
      dispatchLocaleChange(language);
    },
    onSuccess: (updatedUser) => {
      // Invalidate user queries to sync server state (in background)
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
    onError: (_error, _variables, _context) => {
      // On error, revert to server state
      if (currentUser?.language) {
        setOptimisticLanguage(currentUser.language as Locale);
        dispatchLocaleChange(currentUser.language as Locale);
      }
    },
  });

  return {
    language: optimisticLanguage, // Return optimistic value for instant UI
    setLanguage: (locale: Locale) => mutation.mutate(locale),
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

