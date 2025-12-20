/**
 * Browser Supabase client
 * Uses @supabase/ssr for cookie-based session management
 * 
 * Use this client in:
 * - Client components ('use client')
 * - Browser-side code
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

/**
 * Create a Supabase client for browser/client-side usage
 * Sessions are automatically managed via cookies
 */
export function createClient() {
  return createBrowserClient(
    env.supabase.url,
    env.supabase.anonKey
  );
}

/**
 * Singleton browser client for use in client components
 * This maintains a single instance across the app lifecycle
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

// Default export for convenience
export const supabase = getBrowserClient();

