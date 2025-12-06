'use client';

/**
 * Loading skeleton components
 * Placeholder loaders for various content types
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

/**
 * Skeleton for expense cards
 */
export function ExpenseCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Multiple expense card skeletons
 */
export function ExpenseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for group cards
 */
export function GroupCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </Card>
  );
}

/**
 * Multiple group card skeletons
 */
export function GroupListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for balance summary
 */
export function BalanceSummarySkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="space-y-2 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ExpenseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

