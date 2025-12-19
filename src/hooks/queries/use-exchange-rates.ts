/**
 * Exchange rates query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { currencyService } from '@/lib/services';
import { format } from 'date-fns';

/**
 * Hook to get current exchange rate between two currencies
 */
export function useCurrentRate(fromCurrency: string, toCurrency: string) {
  return useQuery({
    queryKey: queryKeys.currency.currentRate(fromCurrency, toCurrency),
    queryFn: () => currencyService.fetchCurrentRate(fromCurrency, toCurrency),
    enabled: fromCurrency !== toCurrency,
    staleTime: 5 * 60 * 1000, // 5 minutes - rates change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Hook to get historical exchange rate for a specific date
 */
export function useHistoricalRate(
  fromCurrency: string,
  toCurrency: string,
  date: Date | undefined
) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

  return useQuery({
    queryKey: queryKeys.currency.historicalRate(fromCurrency, toCurrency, dateStr),
    queryFn: () => {
      if (!date) {
        throw new Error('Date is required');
      }
      return currencyService.fetchHistoricalRate(fromCurrency, toCurrency, date);
    },
    enabled: !!date && fromCurrency !== toCurrency,
    staleTime: Infinity, // Historical rates never change
    gcTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });
}

/**
 * Hook to display rate information
 */
export function useRateDisplay(
  fromCurrency: string,
  toCurrency: string,
  mode: 'simple' | 'smart',
  date?: Date
) {
  const currentRateQuery = useCurrentRate(fromCurrency, toCurrency);
  const historicalRateQuery = useHistoricalRate(
    fromCurrency,
    toCurrency,
    mode === 'smart' ? date : undefined
  );

  const isSimple = mode === 'simple';
  const rate = isSimple ? currentRateQuery.data : historicalRateQuery.data;
  const isLoading = isSimple ? currentRateQuery.isLoading : historicalRateQuery.isLoading;
  const error = isSimple ? currentRateQuery.error : historicalRateQuery.error;

  return {
    rate,
    isLoading,
    error,
    rateDate: isSimple ? new Date() : date,
    rateType: mode,
  };
}

