import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Validate environment variables before creating Supabase client
 */
function validateSupabaseEnv() {
  const url = env.supabase.url;
  const anonKey = env.supabase.anonKey;

  if (!url || url.trim() === '') {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL\n' +
      'Set it in Vercel environment variables (Production, Preview, Development) and redeploy.'
    );
  }

  if (!anonKey || anonKey.trim() === '') {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Set it in Vercel environment variables (Production, Preview, Development) and redeploy.'
    );
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(
      `Invalid Supabase URL format: ${url}\n` +
      'The URL must start with http:// or https://'
    );
  }
}

// Validate before creating client
validateSupabaseEnv();

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

