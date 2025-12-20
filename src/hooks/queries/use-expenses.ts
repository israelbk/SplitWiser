'use client';

/**
 * Expense query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '@/lib/services';
import { CreateExpenseInput, UpdateExpenseInput } from '@/lib/types';
import { queryKeys } from './query-keys';

/**
 * Get ALL expenses for a user (personal + group shares)
 * Full version with all contribution/split details - use for editing
 */
export function useAllExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.all(userId!),
    queryFn: () => expenseService.getAllUserExpenses(userId!),
    enabled: !!userId,
  });
}

/**
 * Get ALL expenses for a user - LIGHTWEIGHT version
 * Faster loading, perfect for list display. Missing some details needed for editing.
 * Use this for initial page load, then switch to useAllExpenses when editing
 */
export function useAllExpensesLight(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses.allLight(userId!),
    queryFn: () => expenseService.getAllUserExpensesLight(userId!),
    enabled: !!userId,
  });
}

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
      // Always invalidate "all" expenses (both full and light versions)
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.all(expense.createdBy),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.allLight(expense.createdBy),
      });
      
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
      // Invalidate "all" expenses (both full and light versions)
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.all(expense.createdBy),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.allLight(expense.createdBy),
      });
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
      groupId?: string | null;
      createdBy: string;
    }) => {
      await expenseService.deleteExpense(id);
      return { groupId, createdBy };
    },
    onSuccess: (result) => {
      // Invalidate "all" expenses (both full and light versions)
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.all(result.createdBy),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.allLight(result.createdBy),
      });

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

