/**
 * User repository
 */

import {
  CreateShadowUserInput,
  CreateUserInput,
  UpdateCurrencyPreferencesInput,
  UpdateUserInput,
  User,
  UserRow,
  userFromRow,
  Locale,
} from '../types';
import { CurrencyPreferences, CurrencyPreferencesRow } from '../types/currency';
import { BaseRepository } from './base.repository';

interface UserCreateRow {
  id?: string;
  name: string;
  email: string;
  avatar_url?: string;
  avatar_color?: string;
  auth_id?: string;
  invited_by?: string;
}

interface UserUpdateRow {
  name?: string;
  email?: string;
  avatar_url?: string;
  avatar_color?: string;
  language?: string;
  currency_preferences?: CurrencyPreferencesRow;
}

export class UserRepository extends BaseRepository<UserRow, User, UserCreateRow, UserUpdateRow> {
  constructor() {
    super('users');
  }

  protected fromRow(row: UserRow): User {
    return userFromRow(row);
  }

  /**
   * Create a user with domain input type
   */
  async createUser(input: CreateUserInput & { id?: string }): Promise<User> {
    return this.create({
      id: input.id,
      name: input.name,
      email: input.email,
      avatar_url: input.avatarUrl,
      avatar_color: input.avatarColor,
    });
  }

  /**
   * Update a user with domain input type
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: UserUpdateRow = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.avatarColor !== undefined) updateData.avatar_color = input.avatarColor;

    return this.update(id, updateData);
  }

  /**
   * Update user's currency preferences
   */
  async updateCurrencyPreferences(
    id: string,
    preferences: UpdateCurrencyPreferencesInput
  ): Promise<User> {
    // Get current preferences first
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    const currentPrefs = user.currencyPreferences;
    const newPrefs: CurrencyPreferencesRow = {
      displayCurrency: preferences.displayCurrency ?? currentPrefs.displayCurrency,
      conversionMode: preferences.conversionMode ?? currentPrefs.conversionMode,
    };

    return this.update(id, { currency_preferences: newPrefs });
  }

  /**
   * Get user's currency preferences
   */
  async getCurrencyPreferences(id: string): Promise<CurrencyPreferences | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    return user.currencyPreferences;
  }

  /**
   * Set user's language preference
   */
  async setLanguage(id: string, language: Locale): Promise<User> {
    return this.update(id, { language });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return this.fromRow(data as UserRow);
  }

  /**
   * Find user by auth ID (Supabase auth)
   */
  async findByAuthId(authId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('auth_id', authId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by auth ID: ${error.message}`);
    }

    return this.fromRow(data as UserRow);
  }

  /**
   * Create a shadow user (invited by email, hasn't signed up yet)
   */
  async createShadowUser(input: CreateShadowUserInput): Promise<User> {
    const email = input.email.toLowerCase();
    const name = input.name || email.split('@')[0];
    
    // Generate a random color for the avatar
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return this.create({
      name,
      email,
      avatar_color: randomColor,
      invited_by: input.invitedBy,
      // No auth_id - this is a shadow user
    });
  }

  /**
   * Get users the current user can add to groups (contacts)
   * Returns users they've been in groups with
   */
  async getContactableUsers(userId: string): Promise<User[]> {
    // Get all groups the user is a member of
    const { data: groupIds, error: groupError } = await this.client
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (groupError) {
      throw new Error(`Failed to get user groups: ${groupError.message}`);
    }

    if (!groupIds || groupIds.length === 0) {
      return [];
    }

    // Get all members of those groups (excluding current user)
    const { data: memberIds, error: memberError } = await this.client
      .from('group_members')
      .select('user_id')
      .in('group_id', groupIds.map(g => g.group_id))
      .neq('user_id', userId);

    if (memberError) {
      throw new Error(`Failed to get group members: ${memberError.message}`);
    }

    if (!memberIds || memberIds.length === 0) {
      return [];
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(memberIds.map(m => m.user_id))];

    // Fetch the users
    const { data: users, error: usersError } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', uniqueUserIds)
      .order('name');

    if (usersError) {
      throw new Error(`Failed to get contactable users: ${usersError.message}`);
    }

    return (users as UserRow[]).map(row => this.fromRow(row));
  }

  /**
   * Get shadow users created by a specific user
   */
  async getShadowUsersCreatedBy(userId: string): Promise<User[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('invited_by', userId)
      .is('auth_id', null)
      .order('name');

    if (error) {
      throw new Error(`Failed to get shadow users: ${error.message}`);
    }

    return (data as UserRow[]).map(row => this.fromRow(row));
  }

  /**
   * Link a shadow user to an auth account when they sign up
   */
  async linkShadowUser(email: string, authId: string, name?: string, avatarUrl?: string): Promise<User> {
    const { data, error } = await this.client.rpc('link_shadow_user', {
      p_email: email.toLowerCase(),
      p_auth_id: authId,
      p_name: name,
      p_avatar_url: avatarUrl,
    });

    if (error) {
      throw new Error(`Failed to link shadow user: ${error.message}`);
    }

    // Fetch and return the updated user
    const user = await this.findById(data as string);
    if (!user) {
      throw new Error('Failed to fetch linked user');
    }
    return user;
  }
}

// Singleton instance
export const userRepository = new UserRepository();

