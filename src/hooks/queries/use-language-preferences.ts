/**
 * Language preferences query hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { userService } from '@/lib/services';
import { Locale, DEFAULT_LOCALE } from '@/lib/types';
import { useCurrentUser } from '../use-current-user';
import { dispatchLocaleChange } from '@/providers/locale-provider';

/**
 * Hook to get current user's language preference
 */
export function useLanguage(): Locale {
  const { currentUser } = useCurrentUser();
  return (currentUser?.language as Locale) ?? DEFAULT_LOCALE;
}

/**
 * Hook to update language preference
 */
export function useSetLanguage() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: async (language: Locale) => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      return userService.setLanguage(currentUser.id, language);
    },
    onMutate: (language) => {
      // Optimistic update: immediately dispatch locale change event
      // This updates the UI instantly while the mutation is in progress
      dispatchLocaleChange(language);
    },
    onSuccess: (updatedUser) => {
      // Invalidate user queries to sync server state
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}

/**
 * Hook to get language settings with update function combined
 */
export function useLanguageSettings() {
  const language = useLanguage();
  const setLanguageMutation = useSetLanguage();

  return {
    language,
    setLanguage: (locale: Locale) => setLanguageMutation.mutate(locale),
    isUpdating: setLanguageMutation.isPending,
    updateError: setLanguageMutation.error,
  };
}

