'use client';

/**
 * Category query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/lib/services';
import { CreateCategoryInput, UpdateCategoryInput } from '@/lib/types';
import { queryKeys } from './query-keys';

/**
 * Get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAllCategories(),
    staleTime: 5 * 60 * 1000, // Categories don't change often
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
 * Create category mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
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
    },
  });
}

/**
 * Delete category mutation
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

