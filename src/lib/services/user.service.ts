/**
 * User service
 * Business logic for user operations
 */

import { userRepository, UserRepository } from '../repositories';
import {
  CreateShadowUserInput,
  CreateUserInput,
  UpdateCurrencyPreferencesInput,
  UpdateUserInput,
  User,
  Locale,
} from '../types';
import { CurrencyPreferences, DEFAULT_CURRENCY_PREFERENCES } from '../types/currency';

export class UserService {
  constructor(private repository: UserRepository = userRepository) {}

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return this.repository.findAll({
      orderBy: { column: 'name', ascending: true },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  /**
   * Create a new user
   * @param input - User data, optionally including ID for auth-linked users
   */
  async createUser(input: CreateUserInput & { id?: string }): Promise<User> {
    return this.repository.createUser(input);
  }

  /**
   * Update a user
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return this.repository.updateUser(id, input);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /**
   * Get multiple users by IDs (batch query - single DB call)
   */
  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.findByIds(ids);
  }

  /**
   * Get user's currency preferences
   */
  async getCurrencyPreferences(userId: string): Promise<CurrencyPreferences> {
    const prefs = await this.repository.getCurrencyPreferences(userId);
    return prefs ?? DEFAULT_CURRENCY_PREFERENCES;
  }

  /**
   * Update user's currency preferences
   */
  async updateCurrencyPreferences(
    userId: string,
    preferences: UpdateCurrencyPreferencesInput
  ): Promise<User> {
    return this.repository.updateCurrencyPreferences(userId, preferences);
  }

  /**
   * Get user's language preference
   */
  async getLanguage(userId: string): Promise<Locale> {
    const user = await this.repository.findById(userId);
    return user?.language ?? 'en';
  }

  /**
   * Set user's language preference
   */
  async setLanguage(userId: string, language: Locale): Promise<User> {
    return this.repository.setLanguage(userId, language);
  }

  // ============================================================================
  // Shadow User Methods
  // ============================================================================

  /**
   * Get user by auth ID (Supabase auth)
   */
  async getUserByAuthId(authId: string): Promise<User | null> {
    return this.repository.findByAuthId(authId);
  }

  /**
   * Create a shadow user (invited by email, hasn't signed up yet)
   * If user already exists with this email, returns existing user
   */
  async createShadowUser(input: CreateShadowUserInput): Promise<User> {
    // Check if user already exists with this email
    const existingUser = await this.repository.findByEmail(input.email);
    if (existingUser) {
      return existingUser;
    }
    
    return this.repository.createShadowUser(input);
  }

  /**
   * Get or create a user by email
   * If user exists, returns them. Otherwise creates a shadow user.
   */
  async getOrCreateUserByEmail(email: string, invitedBy: string, name?: string): Promise<User> {
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      return existingUser;
    }
    
    return this.repository.createShadowUser({
      email,
      name,
      invitedBy,
    });
  }

  /**
   * Get users the current user can add to groups (contacts)
   * These are users they've been in groups with before
   */
  async getContactableUsers(userId: string): Promise<User[]> {
    return this.repository.getContactableUsers(userId);
  }

  /**
   * Get shadow users created by a specific user
   */
  async getShadowUsersCreatedBy(userId: string): Promise<User[]> {
    return this.repository.getShadowUsersCreatedBy(userId);
  }

  /**
   * Link a shadow user to an auth account when they sign up
   * This transfers all expenses and group memberships to the authenticated account
   */
  async linkShadowUser(email: string, authId: string, name?: string, avatarUrl?: string): Promise<User> {
    return this.repository.linkShadowUser(email, authId, name, avatarUrl);
  }
}

// Singleton instance
export const userService = new UserService();

