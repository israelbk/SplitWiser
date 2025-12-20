/**
 * Server-side Supabase client
 * Uses @supabase/ssr for cookie-based session management
 * 
 * Use this client in:
 * - Server Components
 * - Route Handlers (app/api/*)
 * - Server Actions
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/config/env';

/**
 * Create a Supabase client for server-side usage
 * Reads/writes session from/to cookies
 * 
 * Must be called within a request context (Server Component, Route Handler, etc.)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

