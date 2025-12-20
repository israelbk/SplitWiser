/**
 * Group repository
 */

import { BaseRepository } from './base.repository';
import { 
  Group, 
  GroupRow, 
  groupFromRow,
  GroupMember,
  GroupMemberRow,
  groupMemberFromRow,
  CreateGroupInput,
  UpdateGroupInput,
  AddMemberInput,
  MemberRole,
} from '../types';

interface GroupCreateRow {
  name: string;
  description?: string;
  type?: string;
  default_currency?: string;
  cover_image_url?: string;
  created_by: string;
}

interface GroupUpdateRow {
  name?: string;
  description?: string;
  type?: string;
  default_currency?: string;
  cover_image_url?: string;
  is_archived?: boolean;
}

interface GroupMemberCreateRow {
  group_id: string;
  user_id: string;
  role?: string;
}

export class GroupRepository extends BaseRepository<GroupRow, Group, GroupCreateRow, GroupUpdateRow> {
  constructor() {
    super('groups');
  }

  protected fromRow(row: GroupRow): Group {
    return groupFromRow(row);
  }

  /**
   * Get all groups for a user
   */
  async findByUserId(userId: string): Promise<Group[]> {
    const { data, error } = await this.client
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user groups: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const groupIds = data.map((m) => m.group_id);

    const { data: groups, error: groupsError } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', groupIds)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (groupsError) {
      throw new Error(`Failed to fetch groups: ${groupsError.message}`);
    }

    return (groups as GroupRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get non-archived groups
   */
  async findActive(): Promise<Group[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active groups: ${error.message}`);
    }

    return (data as GroupRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Find multiple groups by IDs in a single query (batch)
   */
  async findByIds(ids: string[]): Promise<Group[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to fetch groups by IDs: ${error.message}`);
    }

    return (data as GroupRow[]).map(row => this.fromRow(row));
  }

  /**
   * Create a group with domain input type
   * Uses emails - no need to know if users exist or not
   */
  async createGroup(input: CreateGroupInput): Promise<Group> {
    // Use the email-based function that handles everything
    const { data, error } = await this.client.rpc('create_group_with_emails', {
      p_name: input.name,
      p_creator_email: input.creatorEmail,
      p_member_emails: input.memberEmails,
      p_description: input.description ?? null,
      p_type: input.type ?? 'trip',
      p_default_currency: input.defaultCurrency ?? 'ILS',
      p_cover_image_url: input.coverImageUrl ?? null,
    });

    if (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }

    // The function returns the group ID, fetch the full group
    const groupId = data as string;
    const group = await this.findById(groupId);
    
    if (!group) {
      throw new Error('Group was created but could not be retrieved');
    }

    return group;
  }

  /**
   * Update a group with domain input type
   */
  async updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
    const updateData: GroupUpdateRow = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.defaultCurrency !== undefined) updateData.default_currency = input.defaultCurrency;
    if (input.coverImageUrl !== undefined) updateData.cover_image_url = input.coverImageUrl;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    return this.update(id, updateData);
  }

  /**
   * Add a member to a group by email
   * Uses a SECURITY DEFINER function - creates user if doesn't exist
   */
  async addMember(input: AddMemberInput): Promise<GroupMember> {
    // Use the email-based function that creates user if needed
    const { data, error } = await this.client.rpc('add_group_member_by_email', {
      p_group_id: input.groupId,
      p_email: input.email,
      p_role: input.role ?? 'member',
    });

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }

    // The function returns the user ID
    const userId = data as string;

    // Fetch and return the member record
    const { data: memberData, error: fetchError } = await this.client
      .from('group_members')
      .select('*')
      .eq('group_id', input.groupId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch member after adding: ${fetchError.message}`);
    }

    return groupMemberFromRow(memberData as GroupMemberRow);
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Get all members of a group
   */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await this.client
      .from('group_members')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }

    return (data as GroupMemberRow[]).map((row) => groupMemberFromRow(row));
  }

  /**
   * Get members for multiple groups at once (batch query)
   */
  async getMembersByGroupIds(groupIds: string[]): Promise<GroupMember[]> {
    if (groupIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from('group_members')
      .select('*')
      .in('group_id', groupIds);

    if (error) {
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }

    return (data as GroupMemberRow[]).map((row) => groupMemberFromRow(row));
  }

  /**
   * Update member role
   */
  async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<GroupMember> {
    const { data, error } = await this.client
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return groupMemberFromRow(data as GroupMemberRow);
  }
}

// Singleton instance
export const groupRepository = new GroupRepository();

