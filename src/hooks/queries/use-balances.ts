'use client';

/**
 * Balance query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { balanceService } from '@/lib/services';
import { queryKeys } from './query-keys';
import { useCurrencyPreferences } from './use-currency-preferences';
import { ConversionMode } from '@/lib/types';

interface BalanceOptions {
  /** Use the user's currency preferences for conversion */
  useUserCurrencyPrefs?: boolean;
  /** Override display currency */
  displayCurrency?: string;
  /** Override conversion mode */
  conversionMode?: ConversionMode;
}

/**
 * Get group balance summary
 * Supports currency conversion based on user preferences or explicit options
 */
export function useGroupBalances(
  groupId: string | undefined,
  options?: BalanceOptions
) {
  const { useUserCurrencyPrefs = true, ...overrideOptions } = options || {};
  
  // Get user currency preferences
  const { displayCurrency: userDisplayCurrency, conversionMode: userConversionMode } = 
    useCurrencyPreferences();

  // Determine effective currency settings
  const displayCurrency = overrideOptions.displayCurrency ?? 
    (useUserCurrencyPrefs ? userDisplayCurrency : undefined);
  const conversionMode = overrideOptions.conversionMode ?? 
    (useUserCurrencyPrefs ? userConversionMode : 'off');

  return useQuery({
    queryKey: [
      ...queryKeys.groups.balances(groupId!),
      'currency',
      displayCurrency,
      conversionMode,
    ],
    queryFn: () => balanceService.calculateGroupBalances(groupId!, {
      displayCurrency,
      conversionMode,
    }),
    enabled: !!groupId,
    // Balance calculations with currency conversion may take a bit longer
    staleTime: conversionMode === 'smart' ? 5 * 60 * 1000 : 60 * 1000,
  });
}

/**
 * Get balance between two users in a group
 */
export function useBalanceBetweenUsers(
  groupId: string | undefined,
  userId1: string | undefined,
  userId2: string | undefined,
  options?: BalanceOptions
) {
  const { useUserCurrencyPrefs = true, ...overrideOptions } = options || {};
  
  const { displayCurrency: userDisplayCurrency, conversionMode: userConversionMode } = 
    useCurrencyPreferences();

  const displayCurrency = overrideOptions.displayCurrency ?? 
    (useUserCurrencyPrefs ? userDisplayCurrency : undefined);
  const conversionMode = overrideOptions.conversionMode ?? 
    (useUserCurrencyPrefs ? userConversionMode : 'off');

  return useQuery({
    queryKey: [
      ...queryKeys.groups.balances(groupId!),
      userId1,
      userId2,
      'currency',
      displayCurrency,
      conversionMode,
    ],
    queryFn: () => balanceService.getBalanceBetweenUsers(groupId!, userId1!, userId2!, {
      displayCurrency,
      conversionMode,
    }),
    enabled: !!groupId && !!userId1 && !!userId2,
  });
}
