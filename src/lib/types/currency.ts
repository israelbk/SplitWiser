/**
 * Currency types for multi-currency support
 */

export type ConversionMode = 'off' | 'simple' | 'smart';

export interface CurrencyPreferences {
  displayCurrency: string;  // Target currency code (e.g., 'ILS', 'USD')
  conversionMode: ConversionMode;
}

export const DEFAULT_CURRENCY_PREFERENCES: CurrencyPreferences = {
  displayCurrency: 'ILS',
  conversionMode: 'off',
};

export interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  rateDate: Date;
  fetchedAt: Date;
}

export interface ConvertedAmount {
  original: {
    amount: number;
    currency: string;
  };
  converted: {
    amount: number;
    currency: string;
    rate: number;
    rateDate: Date;
  } | null;
}

// Database row types (snake_case)
export interface ExchangeRateRow {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  rate_date: string;
  fetched_at: string;
}

export interface CurrencyPreferencesRow {
  displayCurrency: string;
  conversionMode: ConversionMode;
}

// Transform functions
export function exchangeRateFromRow(row: ExchangeRateRow): ExchangeRate {
  return {
    id: row.id,
    baseCurrency: row.base_currency,
    targetCurrency: row.target_currency,
    rate: Number(row.rate),
    rateDate: new Date(row.rate_date),
    fetchedAt: new Date(row.fetched_at),
  };
}

export function currencyPreferencesFromRow(
  row: CurrencyPreferencesRow | null | undefined
): CurrencyPreferences {
  if (!row) {
    return DEFAULT_CURRENCY_PREFERENCES;
  }
  return {
    displayCurrency: row.displayCurrency || DEFAULT_CURRENCY_PREFERENCES.displayCurrency,
    conversionMode: row.conversionMode || DEFAULT_CURRENCY_PREFERENCES.conversionMode,
  };
}

