/**
 * OAuth Callback Route Handler
 * 
 * This route handles the OAuth callback from Supabase after Google authentication.
 * It exchanges the authorization code for a session and stores it in cookies.
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google consent screen
 * 3. Google redirects to Supabase callback URL
 * 4. Supabase redirects here with ?code=xxx
 * 5. We exchange code for session (stored in cookies)
 * 6. Redirect to home page (now authenticated)
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    // Redirect to login with error message
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  // Exchange the code for a session
  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError);
        const loginUrl = new URL('/login', origin);
        loginUrl.searchParams.set('error', 'Failed to complete sign in. Please try again.');
        return NextResponse.redirect(loginUrl);
      }

      console.log('[Auth Callback] Session established successfully');
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.');
      return NextResponse.redirect(loginUrl);
    }
  }

  // URL to redirect to after sign in process completes
  // Check for a "next" parameter to support redirect after login
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  return NextResponse.redirect(new URL(next, origin));
}

