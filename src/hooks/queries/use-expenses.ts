'use client';

/**
 * Expense query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/lib/services';
import { CreateExpenseInput, UpdateExpenseInput } from '@/lib/types';
import { queryKeys } from './query-keys';

/**
 * Get personal expenses for a user
 */
export function usePersonalExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.personal(userId!),
    queryFn: () => expenseService.getPersonalExpensesWithDetails(userId!),
    enabled: !!userId,
  });
}

/**
 * Get expenses for a group
 */
export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.group(groupId!),
    queryFn: () => expenseService.getGroupExpensesWithDetails(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Get expense by ID
 */
export function useExpense(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id!),
    queryFn: () => expenseService.getExpenseById(id!),
    enabled: !!id,
  });
}

/**
 * Get expense with full details
 */
export function useExpenseWithDetails(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.withDetails(id!),
    queryFn: () => expenseService.getExpenseWithDetails(id!),
    enabled: !!id,
  });
}

/**
 * Create expense mutation
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expenseService.createExpense(input),
    onSuccess: (expense) => {
      // Invalidate relevant queries based on whether it's a group or personal expense
      if (expense.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.group(expense.groupId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.balances(expense.groupId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.personal(expense.createdBy),
        });
      }
    },
  });
}

/**
 * Update expense mutation
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) =>
      expenseService.updateExpense(id, input),
    onSuccess: async (expense) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.detail(expense.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.withDetails(expense.id),
      });

      if (expense.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.group(expense.groupId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.balances(expense.groupId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.personal(expense.createdBy),
        });
      }
    },
  });
}

/**
 * Delete expense mutation
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      groupId,
      createdBy,
    }: {
      id: string;
      groupId?: string;
      createdBy: string;
    }) => {
      await expenseService.deleteExpense(id);
      return { groupId, createdBy };
    },
    onSuccess: (result) => {
      if (result.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.group(result.groupId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.balances(result.groupId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.personal(result.createdBy),
        });
      }
    },
  });
}

