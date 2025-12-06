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
   */
  async getGroupsForUser(userId: string): Promise<Group[]> {
    return this.repository.findByUserId(userId);
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<Group | null> {
    return this.repository.findById(id);
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
   * Delete a group
   */
  async deleteGroup(id: string): Promise<void> {
    return this.repository.delete(id);
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

