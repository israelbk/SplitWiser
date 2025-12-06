/**
 * User repository
 */

import { BaseRepository } from './base.repository';
import { 
  User, 
  UserRow, 
  userFromRow,
  CreateUserInput,
  UpdateUserInput 
} from '../types';

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

