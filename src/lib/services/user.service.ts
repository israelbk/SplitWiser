/**
 * User service
 * Business logic for user operations
 */

import { userRepository, UserRepository } from '../repositories';
import { User, CreateUserInput, UpdateUserInput } from '../types';

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
   */
  async createUser(input: CreateUserInput): Promise<User> {
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
   * Get multiple users by IDs
   */
  async getUsersByIds(ids: string[]): Promise<User[]> {
    const users = await Promise.all(
      ids.map((id) => this.repository.findById(id))
    );
    return users.filter((u): u is User => u !== null);
  }
}

// Singleton instance
export const userService = new UserService();

