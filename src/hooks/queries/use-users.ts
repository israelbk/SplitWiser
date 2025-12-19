'use client';

/**
 * User query hooks
 */

import { userService } from '@/lib/services';
import { CreateShadowUserInput, CreateUserInput, UpdateUserInput } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * Get all users
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getAllUsers(),
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });
}

/**
 * Create user mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userService.updateUser(id, input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user.id) });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ============================================================================
// Contact & Shadow User Hooks
// ============================================================================

/**
 * Get contactable users (people the current user has been in groups with)
 */
export function useContactableUsers(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.contacts(userId!),
    queryFn: () => userService.getContactableUsers(userId!),
    enabled: !!userId,
  });
}

/**
 * Get shadow users created by the current user
 */
export function useShadowUsers(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.shadowUsers(userId!),
    queryFn: () => userService.getShadowUsersCreatedBy(userId!),
    enabled: !!userId,
  });
}

/**
 * Create shadow user mutation (invite by email)
 */
export function useCreateShadowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShadowUserInput) => userService.createShadowUser(input),
    onSuccess: (user, variables) => {
      // Invalidate contacts and shadow users for the inviter
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.contacts(variables.invitedBy) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.shadowUsers(variables.invitedBy) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Get or create user by email (creates shadow user if doesn't exist)
 */
export function useGetOrCreateUserByEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, invitedBy, name }: { email: string; invitedBy: string; name?: string }) => 
      userService.getOrCreateUserByEmail(email, invitedBy, name),
    onSuccess: (user, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.contacts(variables.invitedBy) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.shadowUsers(variables.invitedBy) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

