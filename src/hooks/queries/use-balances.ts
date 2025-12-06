'use client';

/**
 * Balance query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { balanceService } from '@/lib/services';
import { queryKeys } from './query-keys';

/**
 * Get group balance summary
 */
export function useGroupBalances(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.balances(groupId!),
    queryFn: () => balanceService.calculateGroupBalances(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Get balance between two users in a group
 */
export function useBalanceBetweenUsers(
  groupId: string | undefined,
  userId1: string | undefined,
  userId2: string | undefined
) {
  return useQuery({
    queryKey: [...queryKeys.groups.balances(groupId!), userId1, userId2],
    queryFn: () => balanceService.getBalanceBetweenUsers(groupId!, userId1!, userId2!),
    enabled: !!groupId && !!userId1 && !!userId2,
  });
}

