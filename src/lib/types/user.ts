/**
 * User types
 */

import { 
  CurrencyPreferences, 
  CurrencyPreferencesRow, 
  currencyPreferencesFromRow,
  DEFAULT_CURRENCY_PREFERENCES 
} from './currency';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  avatarColor: string;
  role: UserRole;
  currencyPreferences: CurrencyPreferences;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
}

export interface UpdateCurrencyPreferencesInput {
  displayCurrency?: string;
  conversionMode?: 'off' | 'simple' | 'smart';
}

// Database row type (snake_case)
export interface UserRow {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  role: string | null;
  currency_preferences: CurrencyPreferencesRow | null;
  created_at: string;
}

// Transform database row to domain type
export function userFromRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color ?? '#6366f1',
    role: (row.role as UserRole) ?? 'user',
    currencyPreferences: currencyPreferencesFromRow(row.currency_preferences),
    createdAt: new Date(row.created_at),
  };
}

