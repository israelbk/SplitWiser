/**
 * Currency service
 * Handles currency conversion and Frankfurter API integration
 */

import { format } from 'date-fns';
import { currencyRepository, CurrencyRepository } from '../repositories/currency.repository';
import {
  ConversionMode,
  ConvertedAmount,
  ExchangeRate,
} from '../types/currency';
import { Expense } from '../types/expense';

// Frankfurter API base URL
const FRANKFURTER_API_BASE = 'https://api.frankfurter.app';

// In-memory cache for current session (reduces API calls)
const rateCache = new Map<string, { rate: number; fetchedAt: Date }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes for current rates

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export class CurrencyService {
  constructor(private repository: CurrencyRepository = currencyRepository) {}

  /**
   * Fetch current exchange rate from Frankfurter API
   */
  async fetchCurrentRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    // Same currency - no conversion needed
    if (baseCurrency === targetCurrency) {
      return 1;
    }

    // Check in-memory cache first
    const cacheKey = `${baseCurrency}-${targetCurrency}-current`;
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_DURATION_MS) {
      return cached.rate;
    }

    try {
      const response = await fetch(
        `${FRANKFURTER_API_BASE}/latest?from=${baseCurrency}&to=${targetCurrency}`
      );

      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data: FrankfurterResponse = await response.json();
      const rate = data.rates[targetCurrency];

      if (rate === undefined) {
        throw new Error(`No rate found for ${baseCurrency} to ${targetCurrency}`);
      }

      // Update in-memory cache
      rateCache.set(cacheKey, { rate, fetchedAt: new Date() });

      // Also cache in database for future use
      await this.repository.upsertRate({
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate,
        rate_date: data.date,
      });

      return rate;
    } catch (error) {
      console.error('Failed to fetch current exchange rate:', error);

      // Fallback to latest cached rate from database
      const cachedRate = await this.repository.findLatestRate(baseCurrency, targetCurrency);
      if (cachedRate) {
        return cachedRate.rate;
      }

      throw new Error(`Unable to get exchange rate for ${baseCurrency} to ${targetCurrency}`);
    }
  }

  /**
   * Fetch historical exchange rate from Frankfurter API
   */
  async fetchHistoricalRate(
    baseCurrency: string,
    targetCurrency: string,
    date: Date
  ): Promise<number> {
    // Same currency - no conversion needed
    if (baseCurrency === targetCurrency) {
      return 1;
    }

    // Check database cache first
    const cachedRate = await this.repository.findRate(baseCurrency, targetCurrency, date);
    if (cachedRate) {
      return cachedRate.rate;
    }

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(
        `${FRANKFURTER_API_BASE}/${dateStr}?from=${baseCurrency}&to=${targetCurrency}`
      );

      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
      }

      const data: FrankfurterResponse = await response.json();
      const rate = data.rates[targetCurrency];

      if (rate === undefined) {
        throw new Error(`No rate found for ${baseCurrency} to ${targetCurrency} on ${dateStr}`);
      }

      // Cache in database
      await this.repository.upsertRate({
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate,
        rate_date: data.date,
      });

      return rate;
    } catch (error) {
      console.error('Failed to fetch historical exchange rate:', error);

      // Fallback to nearest available rate
      const nearestRate = await this.repository.findLatestRate(baseCurrency, targetCurrency);
      if (nearestRate) {
        console.warn(`Using nearest available rate from ${nearestRate.rateDate}`);
        return nearestRate.rate;
      }

      throw new Error(
        `Unable to get historical exchange rate for ${baseCurrency} to ${targetCurrency}`
      );
    }
  }

  /**
   * Convert an amount using a given rate
   */
  convertAmount(amount: number, rate: number): number {
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert an expense using simple conversion (current rate)
   */
  async convertExpenseSimple(
    expense: Expense,
    targetCurrency: string
  ): Promise<ConvertedAmount> {
    const original = {
      amount: expense.amount,
      currency: expense.currency,
    };

    // No conversion needed if same currency
    if (expense.currency === targetCurrency) {
      return { original, converted: null };
    }

    const rate = await this.fetchCurrentRate(expense.currency, targetCurrency);
    const convertedAmount = this.convertAmount(expense.amount, rate);

    return {
      original,
      converted: {
        amount: convertedAmount,
        currency: targetCurrency,
        rate,
        rateDate: new Date(),
      },
    };
  }

  /**
   * Convert an expense using smart conversion (historical rate)
   */
  async convertExpenseSmart(
    expense: Expense,
    targetCurrency: string
  ): Promise<ConvertedAmount> {
    const original = {
      amount: expense.amount,
      currency: expense.currency,
    };

    // No conversion needed if same currency
    if (expense.currency === targetCurrency) {
      return { original, converted: null };
    }

    const rate = await this.fetchHistoricalRate(
      expense.currency,
      targetCurrency,
      expense.date
    );
    const convertedAmount = this.convertAmount(expense.amount, rate);

    return {
      original,
      converted: {
        amount: convertedAmount,
        currency: targetCurrency,
        rate,
        rateDate: expense.date,
      },
    };
  }

  /**
   * Batch convert expenses (optimized for lists)
   */
  async convertExpenses(
    expenses: Expense[],
    targetCurrency: string,
    mode: ConversionMode
  ): Promise<Map<string, ConvertedAmount>> {
    const results = new Map<string, ConvertedAmount>();

    // If conversion is off, return empty map
    if (mode === 'off') {
      return results;
    }

    // Group expenses by currency for efficient rate fetching
    const byCurrency = new Map<string, Expense[]>();
    for (const expense of expenses) {
      if (expense.currency !== targetCurrency) {
        const list = byCurrency.get(expense.currency) || [];
        list.push(expense);
        byCurrency.set(expense.currency, list);
      }
    }

    // Process each currency group
    for (const [fromCurrency, currencyExpenses] of byCurrency) {
      if (mode === 'simple') {
        // Fetch current rate once for all expenses in this currency
        const rate = await this.fetchCurrentRate(fromCurrency, targetCurrency);
        const rateDate = new Date();

        for (const expense of currencyExpenses) {
          const convertedAmount = this.convertAmount(expense.amount, rate);
          results.set(expense.id, {
            original: { amount: expense.amount, currency: expense.currency },
            converted: {
              amount: convertedAmount,
              currency: targetCurrency,
              rate,
              rateDate,
            },
          });
        }
      } else {
        // Smart mode: need to fetch historical rates
        // First, check which dates we need
        const dates = [...new Set(currencyExpenses.map(e => format(e.date, 'yyyy-MM-dd')))];
        
        // Try to get cached rates for all dates
        const cachedRates = await this.repository.findRatesByDates(
          fromCurrency,
          targetCurrency,
          currencyExpenses.map(e => e.date)
        );

        // Process each expense
        for (const expense of currencyExpenses) {
          const dateKey = format(expense.date, 'yyyy-MM-dd');
          let rate: number;
          let rateDate: Date;

          const cachedRate = cachedRates.get(dateKey);
          if (cachedRate) {
            rate = cachedRate.rate;
            rateDate = cachedRate.rateDate;
          } else {
            // Fetch from API
            rate = await this.fetchHistoricalRate(fromCurrency, targetCurrency, expense.date);
            rateDate = expense.date;
          }

          const convertedAmount = this.convertAmount(expense.amount, rate);
          results.set(expense.id, {
            original: { amount: expense.amount, currency: expense.currency },
            converted: {
              amount: convertedAmount,
              currency: targetCurrency,
              rate,
              rateDate,
            },
          });
        }
      }
    }

    return results;
  }

  /**
   * Get display amount for an expense (considering conversion)
   */
  getDisplayAmount(
    expense: Expense,
    conversion: ConvertedAmount | undefined,
    mode: ConversionMode
  ): { amount: number; currency: string } {
    if (mode === 'off' || !conversion?.converted) {
      return { amount: expense.amount, currency: expense.currency };
    }
    return {
      amount: conversion.converted.amount,
      currency: conversion.converted.currency,
    };
  }

  /**
   * Calculate total in target currency
   */
  async calculateTotalInCurrency(
    expenses: Expense[],
    targetCurrency: string,
    mode: ConversionMode
  ): Promise<number> {
    if (mode === 'off') {
      // Only sum expenses that are already in the target currency
      return expenses
        .filter(e => e.currency === targetCurrency)
        .reduce((sum, e) => sum + e.amount, 0);
    }

    const conversions = await this.convertExpenses(expenses, targetCurrency, mode);
    
    let total = 0;
    for (const expense of expenses) {
      const conversion = conversions.get(expense.id);
      if (conversion?.converted) {
        total += conversion.converted.amount;
      } else {
        // No conversion needed - same currency
        total += expense.amount;
      }
    }

    return Math.round(total * 100) / 100;
  }
}

// Singleton instance
export const currencyService = new CurrencyService();

