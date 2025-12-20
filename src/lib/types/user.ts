/**
 * User types
 */

import {
  CurrencyPreferences,
  currencyPreferencesFromRow,
  CurrencyPreferencesRow
} from './currency';
import { Locale, DEFAULT_LOCALE } from './locale';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatarColor: string;
  role: UserRole;
  language: Locale;
  currencyPreferences: CurrencyPreferences;
  createdAt: Date;
  // Shadow user fields
  authId?: string;      // Supabase auth ID - undefined for shadow users
  invitedBy?: string;   // User ID of who invited this shadow user
  isShadow: boolean;    // Computed: true if authId is null and invitedBy is set
}

export interface CreateUserInput {
  name: string;
  email: string;
  avatarUrl?: string;
  avatarColor?: string;
  authId?: string;      // Set for real users, undefined for shadow users
  invitedBy?: string;   // Set when creating shadow users
}

export interface CreateShadowUserInput {
  email: string;
  name?: string;        // Optional - defaults to email prefix
  invitedBy: string;    // Required - who is inviting this user
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
  email: string;
  name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  role: string | null;
  language: string | null;
  currency_preferences: CurrencyPreferencesRow | null;
  created_at: string;
  // Shadow user fields
  auth_id: string | null;
  invited_by: string | null;
}

// Transform database row to domain type
export function userFromRow(row: UserRow): User {
  const isShadow = row.auth_id === null && row.invited_by !== null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color ?? '#6366f1',
    role: (row.role as UserRole) ?? 'user',
    language: (row.language as Locale) ?? DEFAULT_LOCALE,
    currencyPreferences: currencyPreferencesFromRow(row.currency_preferences),
    createdAt: new Date(row.created_at),
    authId: row.auth_id ?? undefined,
    invitedBy: row.invited_by ?? undefined,
    isShadow,
  };
}

