/**
 * Next.js Middleware
 * 
 * Handles:
 * 1. Session refresh on every request (keeps sessions alive)
 * 2. Updates cookies with fresh tokens
 * 
 * This middleware runs on every request to ensure:
 * - Expired sessions are refreshed
 * - Session cookies are always up to date
 */

import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback'];

// Routes that should bypass middleware entirely (static assets, etc.)
const BYPASS_ROUTES = ['/_next', '/api', '/favicon.ico', '/manifest.json', '/icon-'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (BYPASS_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client and refresh session
    const { supabaseResponse, user } = await createMiddlewareSupabaseClient(request);

    // Check if route requires authentication
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      // Redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated and on login page, redirect to home
    if (user && pathname === '/login') {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }

    // IMPORTANT: Return the supabaseResponse to ensure cookies are updated
    return supabaseResponse;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // On error, allow the request to continue (fail open)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

