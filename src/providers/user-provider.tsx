'use client';

/**
 * Auth provider with admin view-as functionality
 * Integrates with Supabase Auth for Google OAuth
 * 
 * DEV MODE: Set NEXT_PUBLIC_DEV_MODE=true in .env.local to skip OAuth
 * and auto-login as the first admin user in the database.
 */

import { env } from '@/config/env';
import { supabase } from '@/config/supabase';
import { AuthContext } from '@/hooks/use-current-user';
import { ViewAsContext } from '@/hooks/use-view-as';
import { authService, userService } from '@/lib/services';
import { User } from '@/lib/types';
import { Session } from '@supabase/supabase-js';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

const VIEW_AS_STORAGE_KEY = 'splitwiser-view-as-user-id';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAs, setViewingAsState] = useState<User | null>(null);

  // Get or create user record with timeout
  // This also handles linking shadow users when they sign up
  const getOrCreateUser = async (session: Session): Promise<User | null> => {
    const authUserInfo = authService.extractAuthUser(session.user);
    console.log('[Auth] getOrCreateUser for:', authUserInfo.email);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching user')), 5000)
      );
      
      // First, try to find user by auth ID (returning user)
      const userPromise = userService.getUserByAuthId(authUserInfo.id);
      let user = await Promise.race([userPromise, timeoutPromise]);
      
      console.log('[Auth] getUserByAuthId result:', user ? 'found' : 'not found');
      
      if (!user) {
        // No user with this auth ID - check if there's a shadow user with this email
        console.log('[Auth] Checking for shadow user with email:', authUserInfo.email);
        
        const linkPromise = userService.linkShadowUser(
          authUserInfo.email,
          authUserInfo.id,
          authUserInfo.name,
          authUserInfo.avatarUrl
        );
        
        user = await Promise.race([linkPromise, timeoutPromise]);
        console.log('[Auth] User linked/created:', user?.email, user?.isShadow ? '(was shadow)' : '(new)');
      }
      
      return user;
    } catch (error) {
      console.error('[Auth] Error in getOrCreateUser:', error);
      // Don't return null on error - try to return partial user info
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('[Auth] useEffect starting...');

    // ==========================================================================
    // DEV MODE: Skip OAuth and auto-login as admin
    // ==========================================================================
    if (env.isDevMode) {
      console.log('[Auth] DEV MODE enabled - auto-logging in as admin');
      
      const devModeLogin = async () => {
        try {
          // Get all users and find an admin, or just use the first user
          const users = await userService.getAllUsers();
          const adminUser = users.find(u => u.role === 'admin') || users[0];
          
          if (adminUser) {
            console.log('[Auth] DEV MODE: Logged in as', adminUser.email, '(role:', adminUser.role, ')');
            if (mounted) {
              setAuthUser(adminUser);
              setIsLoading(false);
            }
          } else {
            console.warn('[Auth] DEV MODE: No users found in database');
            if (mounted) {
              setIsLoading(false);
            }
          }
        } catch (error) {
          console.error('[Auth] DEV MODE error:', error);
          if (mounted) {
            setIsLoading(false);
          }
        }
      };
      
      devModeLogin();
      return () => { mounted = false; };
    }

    // ==========================================================================
    // PRODUCTION MODE: Normal OAuth flow
    // ==========================================================================
    const handleSession = async (session: Session | null) => {
      console.log('[Auth] handleSession called, session:', session?.user?.email || 'none');
      
      if (!mounted) {
        console.log('[Auth] Component unmounted, skipping');
        return;
      }

      if (session?.user) {
        try {
          const user = await getOrCreateUser(session);
          console.log('[Auth] Got user:', user?.email || 'null');
          
          if (mounted) {
            setAuthUser(user);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('[Auth] Error handling session:', error);
          if (mounted) {
            setAuthUser(null);
            setIsLoading(false);
          }
        }
      } else {
        console.log('[Auth] No session, clearing user');
        if (mounted) {
          setAuthUser(null);
          setIsLoading(false);
        }
      }
    };

    // Set up auth listener
    console.log('[Auth] Setting up onAuthStateChange listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] onAuthStateChange fired:', event);
        handleSession(session);
      }
    );

    // Also check session immediately (with timeout)
    console.log('[Auth] Checking initial session...');
    const sessionTimeout = setTimeout(() => {
      console.log('[Auth] Session check timed out, stopping loading');
      if (mounted && isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(sessionTimeout);
        console.log('[Auth] getSession result:', session?.user?.email || 'no session', error?.message || '');
        // Only handle if onAuthStateChange hasn't already handled it
        if (mounted && isLoading) {
          handleSession(session);
        }
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error('[Auth] getSession error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      console.log('[Auth] Cleanup');
      mounted = false;
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    // In dev mode, just refresh - we auto-login anyway
    if (env.isDevMode) {
      window.location.reload();
      return;
    }
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    // In dev mode, sign out doesn't really work (no OAuth session)
    // Just clear local state and redirect to login
    if (env.isDevMode) {
      console.log('[Auth] DEV MODE: Sign out is a no-op, refresh to re-login');
      setAuthUser(null);
      setViewingAsState(null);
      localStorage.removeItem(VIEW_AS_STORAGE_KEY);
      return;
    }
    await authService.signOut();
    setAuthUser(null);
    setViewingAsState(null);
    localStorage.removeItem(VIEW_AS_STORAGE_KEY);
  }, []);

  const setViewingAs = useCallback((user: User | null) => {
    if (!authUser || authUser.role !== 'admin') return;
    setViewingAsState(user);
    if (user && user.id !== authUser.id) {
      localStorage.setItem(VIEW_AS_STORAGE_KEY, user.id);
    } else {
      localStorage.removeItem(VIEW_AS_STORAGE_KEY);
    }
  }, [authUser]);

  const isAdmin = authUser?.role === 'admin';
  const isViewingAsOther = viewingAs !== null && viewingAs.id !== authUser?.id;
  const effectiveUser = isViewingAsOther ? viewingAs : authUser;
  const canWrite = !isViewingAsOther;

  const authContextValue = useMemo(() => ({
    authUser,
    isLoading,
    signIn,
    signOut,
    viewingAs,
    setViewingAs,
    isViewingAsOther,
    effectiveUser,
    canWrite,
    isAdmin,
  }), [authUser, isLoading, signIn, signOut, viewingAs, setViewingAs, isViewingAsOther, effectiveUser, canWrite, isAdmin]);

  const viewAsContextValue = useMemo(() => ({
    viewingAs,
    setViewingAs,
    isViewingAsOther,
  }), [viewingAs, setViewingAs, isViewingAsOther]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <ViewAsContext.Provider value={viewAsContextValue}>
        {children}
      </ViewAsContext.Provider>
    </AuthContext.Provider>
  );
}
