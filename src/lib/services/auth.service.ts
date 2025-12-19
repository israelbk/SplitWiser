/**
 * Authentication service
 * Handles Google OAuth via Supabase Auth
 */

import { supabase } from '@/config/supabase';
import { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Sign in with Google OAuth
 * Redirects to Google consent screen
 */
async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current session
 */
async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Get session error:', error);
    return null;
  }
  
  return session;
}

/**
 * Get the current authenticated user
 */
async function getCurrentUser(): Promise<SupabaseUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Get user error:', error);
    return null;
  }
  
  return user;
}

/**
 * Subscribe to auth state changes
 */
function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  
  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}

/**
 * Extract user info from Supabase auth user
 */
function extractAuthUser(user: SupabaseUser): AuthUser {
  const metadata = user.user_metadata || {};
  
  return {
    id: user.id,
    email: user.email || '',
    name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
    avatarUrl: metadata.avatar_url || metadata.picture,
  };
}

/**
 * Generate a random avatar color
 */
function generateAvatarColor(): string {
  const colors = [
    '#6366f1', // indigo
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ef4444', // red
    '#06b6d4', // cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const authService = {
  signInWithGoogle,
  signOut,
  getSession,
  getCurrentUser,
  onAuthStateChange,
  extractAuthUser,
  generateAvatarColor,
};

