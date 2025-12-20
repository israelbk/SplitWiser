/**
 * Currency repository
 * Handles exchange rate caching in Supabase
 */

import { supabase } from '@/lib/supabase';
import {
  ExchangeRate,
  ExchangeRateRow,
  exchangeRateFromRow,
} from '../types/currency';
import { format } from 'date-fns';

export interface CreateExchangeRateInput {
  base_currency: string;
  target_currency: string;
  rate: number;
  rate_date: string; // ISO date string (YYYY-MM-DD)
}

export class CurrencyRepository {
  private client = supabase;
  private tableName = 'exchange_rates';

  /**
   * Find a cached exchange rate for a specific date
   */
  async findRate(
    baseCurrency: string,
    targetCurrency: string,
    date: Date
  ): Promise<ExchangeRate | null> {
    const dateStr = format(date, 'yyyy-MM-dd');

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .eq('rate_date', dateStr)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Failed to fetch exchange rate:', error);
      return null;
    }

    return exchangeRateFromRow(data as ExchangeRateRow);
  }

  /**
   * Find the latest cached exchange rate (most recent date)
   */
  async findLatestRate(
    baseCurrency: string,
    targetCurrency: string
  ): Promise<ExchangeRate | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Failed to fetch latest exchange rate:', error);
      return null;
    }

    return exchangeRateFromRow(data as ExchangeRateRow);
  }

  /**
   * Insert or update an exchange rate (upsert)
   */
  async upsertRate(input: CreateExchangeRateInput): Promise<ExchangeRate> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert(
        {
          ...input,
          fetched_at: new Date().toISOString(),
        },
        {
          onConflict: 'base_currency,target_currency,rate_date',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert exchange rate: ${error.message}`);
    }

    return exchangeRateFromRow(data as ExchangeRateRow);
  }

  /**
   * Find rates for a date range (for batch smart convert)
   */
  async findRatesForDateRange(
    baseCurrency: string,
    targetCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExchangeRate[]> {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .gte('rate_date', startStr)
      .lte('rate_date', endStr)
      .order('rate_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch exchange rates for range:', error);
      return [];
    }

    return (data as ExchangeRateRow[]).map(exchangeRateFromRow);
  }

  /**
   * Find multiple rates by dates (for batch lookups)
   */
  async findRatesByDates(
    baseCurrency: string,
    targetCurrency: string,
    dates: Date[]
  ): Promise<Map<string, ExchangeRate>> {
    const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .in('rate_date', dateStrings);

    if (error) {
      console.error('Failed to fetch exchange rates by dates:', error);
      return new Map();
    }

    const ratesMap = new Map<string, ExchangeRate>();
    (data as ExchangeRateRow[]).forEach(row => {
      const rate = exchangeRateFromRow(row);
      ratesMap.set(format(rate.rateDate, 'yyyy-MM-dd'), rate);
    });

    return ratesMap;
  }

  /**
   * Clean up old exchange rates (keep only last N days)
   * Useful for maintenance
   */
  async cleanupOldRates(keepDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const cutoffStr = format(cutoffDate, 'yyyy-MM-dd');

    const { data, error } = await this.client
      .from(this.tableName)
      .delete()
      .lt('rate_date', cutoffStr)
      .select('id');

    if (error) {
      console.error('Failed to cleanup old exchange rates:', error);
      return 0;
    }

    return data?.length ?? 0;
  }
}

// Singleton instance
export const currencyRepository = new CurrencyRepository();

