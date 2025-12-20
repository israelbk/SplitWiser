/**
 * Supabase client exports
 * 
 * Usage:
 * - Browser/Client components: import { supabase } from '@/lib/supabase'
 * - Server components/Route handlers: import { createServerSupabaseClient } from '@/lib/supabase/server'
 * - Middleware: import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'
 */

export { supabase, createClient, getBrowserClient } from './client';

