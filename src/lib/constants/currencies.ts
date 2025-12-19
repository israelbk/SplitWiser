/**
 * Currency definitions
 * Multi-currency support with primary and secondary currencies
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
  priority: 'primary' | 'secondary';
}

export const CURRENCIES: Record<string, Currency> = {
  // Primary currencies (shown at top of picker)
  ILS: {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'primary',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'primary',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'primary',
  },
  // Secondary currencies (in expandable section)
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'secondary',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    symbolPosition: 'before',
    priority: 'secondary',
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'secondary',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'secondary',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    symbolPosition: 'before',
    priority: 'secondary',
  },
};

export const DEFAULT_CURRENCY = 'ILS';

export const CURRENCY_LIST = Object.values(CURRENCIES);

export const PRIMARY_CURRENCIES = CURRENCY_LIST.filter(c => c.priority === 'primary');
export const SECONDARY_CURRENCIES = CURRENCY_LIST.filter(c => c.priority === 'secondary');

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency {
  return CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = getCurrency(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  return currency.symbolPosition === 'before'
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
}

/**
 * Format amount with currency code (for clearer display)
 */
export function formatCurrencyWithCode(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = getCurrency(currencyCode);
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  return `${formatted} ${currency.code}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrencyInput(value: string): number {
  // Remove any non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if a currency code is valid
 */
export function isValidCurrency(code: string): boolean {
  return code in CURRENCIES;
}
