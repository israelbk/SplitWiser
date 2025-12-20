'use client';

/**
 * Login page
 * Google OAuth sign-in
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { Wallet, Loader2, RefreshCw } from 'lucide-react';

// Google icon SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser, isLoading, signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Check if we were redirected here (potential loop detection)
  useEffect(() => {
    // If we've been redirected multiple times, show troubleshoot option
    const redirectCount = parseInt(sessionStorage.getItem('login-redirect-count') || '0');
    sessionStorage.setItem('login-redirect-count', String(redirectCount + 1));
    
    if (redirectCount >= 2) {
      setShowTroubleshoot(true);
    }
    
    // Clear count on successful load after 5 seconds
    const timer = setTimeout(() => {
      sessionStorage.setItem('login-redirect-count', '0');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle force clear from URL param
  useEffect(() => {
    if (searchParams.get('clear') === 'true') {
      handleForceClear();
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && authUser) {
      sessionStorage.setItem('login-redirect-count', '0');
      router.push('/');
    }
  }, [authUser, isLoading, router]);

  // Force clear all session data
  const handleForceClear = async () => {
    setIsClearing(true);
    setError(null);
    
    try {
      // Clear all localStorage items related to auth FIRST (before signOut which might hang)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('splitwiser') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Try to sign out, but don't wait forever (use local scope, faster)
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
      } catch {
        // Ignore signOut errors - storage is already cleared
        console.log('SignOut skipped or timed out - continuing with reload');
      }
      
      // Small delay to ensure storage changes are flushed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload the page clean (use replace to avoid back button issues)
      window.location.replace('/login');
    } catch (err) {
      console.error('Force clear error:', err);
      setError('Failed to clear session. Try clearing browser data manually.');
      setIsClearing(false);
    }
    // Note: Don't set isClearing(false) in success case - we're redirecting
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    
    try {
      await signIn();
      // Redirect happens automatically via auth state change
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (authUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-card-in">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Wallet className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome to SplitWiser</CardTitle>
            <CardDescription className="text-base">
              Track personal expenses and split costs with friends
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Features list */}
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg">💰</span>
              </div>
              <span>Track personal and group expenses</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg">👥</span>
              </div>
              <span>Split bills with friends easily</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg">💱</span>
              </div>
              <span>Multi-currency support</span>
            </div>
          </div>

          {/* Sign in button */}
          <Button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 text-base font-medium gap-3"
            variant="outline"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </>
            )}
          </Button>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Troubleshooting section - shown if redirect loop detected */}
          {showTroubleshoot && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Having trouble signing in?
              </p>
              <Button
                onClick={handleForceClear}
                disabled={isClearing}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Clear Session & Retry
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{' '}
            <span className="underline cursor-pointer hover:text-foreground">Terms of Service</span>
            {' '}and{' '}
            <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

