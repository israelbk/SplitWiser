'use client';

/**
 * Group query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupService } from '@/lib/services';
import { CreateGroupInput, UpdateGroupInput, AddMemberInput, MemberRole } from '@/lib/types';
import { queryKeys } from './query-keys';

/**
 * Get all groups
 */
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: () => groupService.getAllGroups(),
  });
}

/**
 * Get groups for a specific user
 * @param includeArchived - Whether to include archived groups (default: false)
 */
export function useGroupsForUser(userId: string | undefined, includeArchived: boolean = false) {
  return useQuery({
    queryKey: [...queryKeys.groups.forUser(userId!), { includeArchived }] as const,
    queryFn: () => groupService.getGroupsForUser(userId!, includeArchived),
    enabled: !!userId,
  });
}

/**
 * Get groups for a specific user WITH members (optimized batch query)
 * This is MUCH faster than fetching each group's members separately
 * @param includeArchived - Whether to include archived groups (default: false)
 */
export function useGroupsForUserWithMembers(userId: string | undefined, includeArchived: boolean = false) {
  return useQuery({
    queryKey: [...queryKeys.groups.forUser(userId!), 'withMembers', { includeArchived }] as const,
    queryFn: () => groupService.getGroupsForUserWithMembers(userId!, includeArchived),
    enabled: !!userId,
  });
}

/**
 * Get archived groups for a specific user
 */
export function useArchivedGroupsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.groups.forUser(userId!), 'archived'] as const,
    queryFn: () => groupService.getArchivedGroupsForUser(userId!),
    enabled: !!userId,
  });
}

/**
 * Get group by ID
 */
export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id!),
    queryFn: () => groupService.getGroupById(id!),
    enabled: !!id,
  });
}

/**
 * Get group with members
 */
export function useGroupWithMembers(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.withMembers(id!),
    queryFn: () => groupService.getGroupWithMembers(id!),
    enabled: !!id,
  });
}

/**
 * Get group members
 */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId!),
    queryFn: () => groupService.getGroupMembersWithUsers(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Create group mutation
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupService.createGroup(input),
    onSuccess: () => {
      // Invalidate all group queries - we don't know the user IDs anymore (just emails)
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

/**
 * Update group mutation
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) =>
      groupService.updateGroup(id, input),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(group.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.withMembers(group.id) });
    },
  });
}

/**
 * Archive group mutation
 */
export function useArchiveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupService.archiveGroup(id),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(group.id) });
    },
  });
}

/**
 * Unarchive group mutation
 */
export function useUnarchiveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupService.unarchiveGroup(id),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(group.id) });
    },
  });
}

/**
 * Delete group mutation
 * This permanently deletes the group and all its expenses
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id),
    onSuccess: () => {
      // Invalidate all group queries
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      // Also invalidate expense queries since group expenses are deleted
      // Use partial matching to invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

/**
 * Add member mutation
 */
export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddMemberInput) => groupService.addMember(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.withMembers(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(variables.groupId) });
      // Also invalidate all groups since we added by email, not user ID
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

/**
 * Remove member mutation
 */
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupService.removeMember(groupId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.withMembers(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.balances(variables.groupId) });
    },
  });
}

/**
 * Update member role mutation
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
      role,
    }: {
      groupId: string;
      userId: string;
      role: MemberRole;
    }) => groupService.updateMemberRole(groupId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.withMembers(variables.groupId) });
    },
  });
}

