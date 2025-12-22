'use client';

/**
 * Category query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/lib/services';
import { CreateCategoryInput, UpdateCategoryInput } from '@/lib/types';
import { queryKeys } from './query-keys';

/**
 * Get all categories (deprecated - use useUserCategories instead)
 * @deprecated Use useUserCategories for proper user-scoped categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAllCategories(),
    staleTime: 5 * 60 * 1000, // Categories don't change often
  });
}

/**
 * Get categories for a specific user (system + user's custom categories)
 */
export function useUserCategories(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.forUser(userId!),
    queryFn: () => categoryService.getCategoriesForUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get only custom categories for a specific user
 */
export function useCustomCategories(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.customForUser(userId!),
    queryFn: () => categoryService.getCustomCategoriesForUser(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get system categories only
 */
export function useSystemCategories() {
  return useQuery({
    queryKey: queryKeys.categories.system,
    queryFn: () => categoryService.getSystemCategories(),
    staleTime: 10 * 60 * 1000, // System categories are static
  });
}

/**
 * Get category by ID
 */
export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id!),
    queryFn: () => categoryService.getCategoryById(id!),
    enabled: !!id,
  });
}

/**
 * Get expense count for a category
 */
export function useCategoryExpenseCount(categoryId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.expenseCount(categoryId!, userId!),
    queryFn: () => categoryService.getExpenseCount(categoryId!, userId!),
    enabled: !!categoryId && !!userId,
  });
}

/**
 * Create category mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.createCategory(input),
    onSuccess: (_category, variables) => {
      // Invalidate both the all list and user-specific list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      if (variables.createdBy) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.categories.forUser(variables.createdBy) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.categories.customForUser(variables.createdBy) 
        });
      }
    },
  });
}

/**
 * Update category mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoryService.updateCategory(id, input),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(category.id) });
      if (category.createdBy) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.categories.forUser(category.createdBy) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.categories.customForUser(category.createdBy) 
        });
      }
    },
  });
}

/**
 * Delete category mutation (simple - no expense migration)
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Delete category with replacement mutation
 * Migrates all expenses from the deleted category to the replacement category
 */
export function useDeleteCategoryWithReplacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      replacementCategoryId,
      userId,
    }: {
      categoryId: string;
      replacementCategoryId: string;
      userId: string;
    }) => categoryService.deleteCategoryWithReplacement(categoryId, replacementCategoryId, userId),
    onSuccess: (_result, variables) => {
      // Invalidate category queries
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.forUser(variables.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.customForUser(variables.userId) 
      });
      // Invalidate expense queries since we migrated categories
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.expenses.personal(variables.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.expenses.all(variables.userId) 
      });
    },
  });
}

/**
 * Reorder categories mutation
 * Updates the sort order of custom categories for drag-and-drop reordering
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      categoryOrders,
    }: {
      userId: string;
      categoryOrders: { id: string; sortOrder: number }[];
    }) => categoryService.reorderCategories(userId, categoryOrders),
    onSuccess: (_result, variables) => {
      // Invalidate category queries to refresh the order
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.forUser(variables.userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.categories.customForUser(variables.userId) 
      });
    },
  });
}

