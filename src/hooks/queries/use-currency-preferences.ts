/**
 * Currency preferences query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { userService } from '@/lib/services';
import { 
  CurrencyPreferences, 
  DEFAULT_CURRENCY_PREFERENCES,
  UpdateCurrencyPreferencesInput,
} from '@/lib/types';
import { useCurrentUser } from '../use-current-user';

/**
 * Hook to get current user's currency preferences
 */
export function useCurrencyPreferences() {
  const { currentUser, isLoading: userLoading } = useCurrentUser();

  const query = useQuery({
    queryKey: queryKeys.currency.preferences(currentUser?.id ?? ''),
    queryFn: () => {
      if (!currentUser) {
        return DEFAULT_CURRENCY_PREFERENCES;
      }
      return userService.getCurrencyPreferences(currentUser.id);
    },
    enabled: !!currentUser && !userLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    preferences: query.data ?? DEFAULT_CURRENCY_PREFERENCES,
    displayCurrency: query.data?.displayCurrency ?? DEFAULT_CURRENCY_PREFERENCES.displayCurrency,
    conversionMode: query.data?.conversionMode ?? DEFAULT_CURRENCY_PREFERENCES.conversionMode,
    isLoading: query.isLoading || userLoading,
    error: query.error,
  };
}

/**
 * Hook to update currency preferences
 */
export function useUpdateCurrencyPreferences() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: (input: UpdateCurrencyPreferencesInput) => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      return userService.updateCurrencyPreferences(currentUser.id, input);
    },
    onSuccess: (updatedUser) => {
      // Invalidate and refetch currency preferences
      queryClient.invalidateQueries({
        queryKey: queryKeys.currency.preferences(updatedUser.id),
      });
      // Also invalidate user detail since it includes preferences
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });
    },
  });
}

/**
 * Hook to get preferences with update function combined
 */
export function useCurrencySettings() {
  const { preferences, displayCurrency, conversionMode, isLoading, error } = 
    useCurrencyPreferences();
  const updateMutation = useUpdateCurrencyPreferences();

  const setDisplayCurrency = (currency: string) => {
    updateMutation.mutate({ displayCurrency: currency });
  };

  const setConversionMode = (mode: 'off' | 'simple' | 'smart') => {
    updateMutation.mutate({ conversionMode: mode });
  };

  const updatePreferences = (input: UpdateCurrencyPreferencesInput) => {
    updateMutation.mutate(input);
  };

  return {
    preferences,
    displayCurrency,
    conversionMode,
    isLoading,
    error,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    setDisplayCurrency,
    setConversionMode,
    updatePreferences,
  };
}

