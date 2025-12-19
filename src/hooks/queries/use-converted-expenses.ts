/**
 * Converted expenses hook
 * Provides expense amounts converted to the user's display currency
 */

import { currencyService } from '@/lib/services';
import { ConversionMode, ConvertedAmount, Expense } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from './query-keys';
import { useCurrencyPreferences } from './use-currency-preferences';

interface UseConvertedExpensesOptions {
  expenses: Expense[];
  enabled?: boolean;
  /** Override conversion mode (useful for always fetching for percentage calculations) */
  conversionMode?: ConversionMode;
}

/**
 * Hook to get converted amounts for a list of expenses
 */
export function useConvertedExpenses({ 
  expenses, 
  enabled = true,
  conversionMode: overrideMode,
}: UseConvertedExpensesOptions) {
  const { 
    displayCurrency, 
    conversionMode: userMode, 
    isLoading: prefsLoading 
  } = useCurrencyPreferences();
  
  // Use override mode if provided, otherwise use user's preference
  const effectiveMode = overrideMode ?? userMode;

  // Create a stable key based on expense IDs
  const expenseIds = useMemo(
    () => expenses.map(e => e.id).sort(),
    [expenses]
  );

  const query = useQuery({
    queryKey: queryKeys.currency.conversions(expenseIds, effectiveMode, displayCurrency),
    queryFn: () => currencyService.convertExpenses(expenses, displayCurrency, effectiveMode),
    // Don't skip when mode is 'off' if we have an override or if enabled is explicitly true
    enabled: enabled && !prefsLoading && effectiveMode !== 'off' && expenses.length > 0,
    staleTime: effectiveMode === 'smart' ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    conversions: query.data ?? new Map<string, ConvertedAmount>(),
    isLoading: query.isLoading || prefsLoading,
    isConverting: query.isFetching,
    error: query.error,
    conversionMode: userMode, // Return user's actual preference for display logic
    displayCurrency,
  };
}

/**
 * Hook to get a single expense with its converted amount
 */
export function useConvertedExpense(expense: Expense | undefined) {
  const { displayCurrency, conversionMode, isLoading: prefsLoading } = useCurrencyPreferences();

  const query = useQuery({
    queryKey: expense 
      ? queryKeys.currency.conversions([expense.id], conversionMode, displayCurrency)
      : ['currency', 'conversions', 'none'],
    queryFn: async () => {
      if (!expense) return null;
      const conversions = await currencyService.convertExpenses(
        [expense],
        displayCurrency,
        conversionMode
      );
      return conversions.get(expense.id) ?? null;
    },
    enabled: !!expense && !prefsLoading && conversionMode !== 'off',
    staleTime: conversionMode === 'smart' ? Infinity : 5 * 60 * 1000,
  });

  return {
    conversion: query.data ?? null,
    isLoading: query.isLoading || prefsLoading,
    error: query.error,
    displayCurrency,
    conversionMode,
  };
}

/**
 * Helper hook to get display values for an expense
 */
export function useExpenseDisplayAmount(
  expense: Expense | undefined,
  conversion: ConvertedAmount | null | undefined,
  mode: ConversionMode
) {
  return useMemo(() => {
    if (!expense) {
      return {
        displayAmount: 0,
        displayCurrency: 'ILS',
        isConverted: false,
        originalAmount: 0,
        originalCurrency: 'ILS',
        rate: null,
        rateDate: null,
      };
    }

    if (mode === 'off' || !conversion?.converted) {
      return {
        displayAmount: expense.amount,
        displayCurrency: expense.currency,
        isConverted: false,
        originalAmount: expense.amount,
        originalCurrency: expense.currency,
        rate: null,
        rateDate: null,
      };
    }

    return {
      displayAmount: conversion.converted.amount,
      displayCurrency: conversion.converted.currency,
      isConverted: true,
      originalAmount: conversion.original.amount,
      originalCurrency: conversion.original.currency,
      rate: conversion.converted.rate,
      rateDate: conversion.converted.rateDate,
    };
  }, [expense, conversion, mode]);
}

/**
 * Hook to calculate total in display currency
 */
export function useConvertedTotal(expenses: Expense[]) {
  const { displayCurrency, conversionMode, isLoading: prefsLoading } = useCurrencyPreferences();
  
  const expenseIds = useMemo(
    () => expenses.map(e => e.id).sort(),
    [expenses]
  );

  const query = useQuery({
    queryKey: ['currency', 'total', conversionMode, displayCurrency, ...expenseIds],
    queryFn: () => currencyService.calculateTotalInCurrency(
      expenses,
      displayCurrency,
      conversionMode
    ),
    enabled: !prefsLoading && expenses.length > 0,
    staleTime: conversionMode === 'smart' ? Infinity : 5 * 60 * 1000,
  });

  return {
    total: query.data ?? 0,
    isLoading: query.isLoading || prefsLoading,
    error: query.error,
    displayCurrency,
    conversionMode,
  };
}

