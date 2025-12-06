import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client instance
 * Used for all database operations
 */
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);

/**
 * Type-safe database types will be generated from Supabase
 * For now, we use our own type definitions
 */
export type { SupabaseClient } from '@supabase/supabase-js';

