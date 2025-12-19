'use client';

/**
 * Auth guard component
 * Protects routes by redirecting unauthenticated users to login
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-current-user';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, isLoading } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If not authenticated and trying to access protected route
    if (!authUser && !isPublicRoute) {
      router.push('/login');
    }

    // If authenticated and on login page, redirect to home
    if (authUser && pathname === '/login') {
      router.push('/');
    }
  }, [authUser, isLoading, isPublicRoute, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!authUser && !isPublicRoute) {
    return null;
  }

  // Render children for authenticated users or public routes
  return <>{children}</>;
}

