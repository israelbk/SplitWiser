/**
 * User repository
 */

import { BaseRepository } from './base.repository';
import { 
  User, 
  UserRow, 
  userFromRow,
  CreateUserInput,
  UpdateUserInput,
  UpdateCurrencyPreferencesInput,
} from '../types';
import { CurrencyPreferences, CurrencyPreferencesRow } from '../types/currency';

interface UserCreateRow {
  name: string;
  email?: string;
  avatar_url?: string;
  avatar_color?: string;
}

interface UserUpdateRow {
  name?: string;
  email?: string;
  avatar_url?: string;
  avatar_color?: string;
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
  async createUser(input: CreateUserInput): Promise<User> {
    return this.create({
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
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return this.fromRow(data as UserRow);
  }
}

// Singleton instance
export const userRepository = new UserRepository();

