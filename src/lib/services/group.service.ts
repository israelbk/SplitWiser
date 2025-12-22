/**
 * Group service
 * Business logic for group operations
 */

import { groupRepository, GroupRepository } from '../repositories';
import { userService } from './user.service';
import { 
  Group, 
  GroupMember, 
  CreateGroupInput, 
  UpdateGroupInput,
  AddMemberInput,
  MemberRole,
  User,
} from '../types';

export interface GroupWithMembers extends Group {
  members: (GroupMember & { user: User })[];
}

export class GroupService {
  constructor(private repository: GroupRepository = groupRepository) {}

  /**
   * Get all active groups
   */
  async getAllGroups(): Promise<Group[]> {
    return this.repository.findActive();
  }

  /**
   * Get groups for a specific user
   * @param userId - The user ID
   * @param includeArchived - Whether to include archived groups (default: false)
   */
  async getGroupsForUser(userId: string, includeArchived: boolean = false): Promise<Group[]> {
    return this.repository.findByUserId(userId, includeArchived);
  }

  /**
   * Get archived groups for a specific user
   */
  async getArchivedGroupsForUser(userId: string): Promise<Group[]> {
    return this.repository.findArchivedByUserId(userId);
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<Group | null> {
    return this.repository.findById(id);
  }

  /**
   * Get multiple groups by IDs (batch query - single DB call)
   */
  async getGroupsByIds(ids: string[]): Promise<Group[]> {
    if (ids.length === 0) return [];
    return this.repository.findByIds(ids);
  }

  /**
   * Get group with members populated
   */
  async getGroupWithMembers(id: string): Promise<GroupWithMembers | null> {
    const group = await this.repository.findById(id);
    if (!group) return null;

    const members = await this.getGroupMembers(id);
    const memberUserIds = members.map((m) => m.userId);
    const users = await userService.getUsersByIds(memberUserIds);

    const membersWithUsers = members.map((member) => ({
      ...member,
      user: users.find((u) => u.id === member.userId)!,
    }));

    return {
      ...group,
      members: membersWithUsers,
    };
  }

  /**
   * Get multiple groups with members populated (batch - optimized)
   * Much faster than calling getGroupWithMembers for each group
   */
  async getGroupsWithMembers(groupIds: string[]): Promise<GroupWithMembers[]> {
    if (groupIds.length === 0) return [];

    // Batch fetch all groups
    const groups = await this.repository.findByIds(groupIds);
    if (groups.length === 0) return [];

    // Batch fetch all members for all groups
    const allMembers = await this.repository.getMembersByGroupIds(groupIds);
    
    // Collect all unique user IDs
    const allUserIds = [...new Set(allMembers.map(m => m.userId))];
    
    // Batch fetch all users
    const allUsers = await userService.getUsersByIds(allUserIds);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // Group members by group ID
    const membersByGroup = new Map<string, typeof allMembers>();
    for (const member of allMembers) {
      const existing = membersByGroup.get(member.groupId) || [];
      existing.push(member);
      membersByGroup.set(member.groupId, existing);
    }

    // Assemble final result
    return groups.map(group => ({
      ...group,
      members: (membersByGroup.get(group.id) || []).map(member => ({
        ...member,
        user: userMap.get(member.userId)!,
      })),
    }));
  }

  /**
   * Get groups for a user WITH members already populated (optimized)
   * @param userId - The user ID
   * @param includeArchived - Whether to include archived groups (default: false)
   */
  async getGroupsForUserWithMembers(userId: string, includeArchived: boolean = false): Promise<GroupWithMembers[]> {
    const groups = await this.repository.findByUserId(userId, includeArchived);
    if (groups.length === 0) return [];
    
    return this.getGroupsWithMembers(groups.map(g => g.id));
  }

  /**
   * Create a new group
   */
  async createGroup(input: CreateGroupInput): Promise<Group> {
    return this.repository.createGroup(input);
  }

  /**
   * Update a group
   */
  async updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
    return this.repository.updateGroup(id, input);
  }

  /**
   * Archive a group
   */
  async archiveGroup(id: string): Promise<Group> {
    return this.repository.updateGroup(id, { isArchived: true });
  }

  /**
   * Unarchive a group
   */
  async unarchiveGroup(id: string): Promise<Group> {
    return this.repository.updateGroup(id, { isArchived: false });
  }

  /**
   * Soft delete a group
   * The group and its expenses remain in the database but are marked as deleted
   * Expenses from deleted groups will not appear in user expense lists
   */
  async deleteGroup(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }

  /**
   * Get members of a group
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.repository.getMembers(groupId);
  }

  /**
   * Get members with user details
   */
  async getGroupMembersWithUsers(groupId: string): Promise<(GroupMember & { user: User })[]> {
    const members = await this.repository.getMembers(groupId);
    const userIds = members.map((m) => m.userId);
    const users = await userService.getUsersByIds(userIds);

    return members.map((member) => ({
      ...member,
      user: users.find((u) => u.id === member.userId)!,
    }));
  }

  /**
   * Add a member to a group
   */
  async addMember(input: AddMemberInput): Promise<GroupMember> {
    return this.repository.addMember(input);
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    return this.repository.removeMember(groupId, userId);
  }

  /**
   * Update member role
   */
  async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<GroupMember> {
    return this.repository.updateMemberRole(groupId, userId, role);
  }

  /**
   * Check if user is a member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    const members = await this.repository.getMembers(groupId);
    return members.some((m) => m.userId === userId);
  }

  /**
   * Check if user is owner of a group
   */
  async isOwner(groupId: string, userId: string): Promise<boolean> {
    const members = await this.repository.getMembers(groupId);
    const member = members.find((m) => m.userId === userId);
    return member?.role === 'owner';
  }
}

// Singleton instance
export const groupService = new GroupService();

