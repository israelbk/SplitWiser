/**
 * Category service
 * Business logic for category operations
 */

import { categoryRepository, CategoryRepository, expenseRepository, ExpenseRepository } from '../repositories';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';

export class CategoryService {
  constructor(
    private repository: CategoryRepository = categoryRepository,
    private expenseRepo: ExpenseRepository = expenseRepository
  ) {}

  /**
   * Get all categories ordered by sort order
   * @deprecated Use getCategoriesForUser instead for proper user-scoped categories
   */
  async getAllCategories(): Promise<Category[]> {
    return this.repository.findAllOrdered();
  }

  /**
   * Get categories for a specific user (system + user's custom categories)
   */
  async getCategoriesForUser(userId: string): Promise<Category[]> {
    return this.repository.findByUser(userId);
  }

  /**
   * Get only custom categories for a specific user
   */
  async getCustomCategoriesForUser(userId: string): Promise<Category[]> {
    return this.repository.findCustomByUser(userId);
  }

  /**
   * Get only system (predefined) categories
   */
  async getSystemCategories(): Promise<Category[]> {
    return this.repository.findSystemCategories();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    return this.repository.findById(id);
  }

  /**
   * Create a custom category for a user
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    // Get next sort order for user's categories
    const sortOrder = input.sortOrder ?? await this.repository.getNextSortOrder(input.createdBy!);
    
    return this.repository.createCategory({
      ...input,
      isSystem: false, // Custom categories are never system categories
      sortOrder,
    });
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.repository.findById(id);
    if (category?.isSystem) {
      throw new Error('Cannot update system categories');
    }
    return this.repository.updateCategory(id, input);
  }

  /**
   * Delete a category (only custom categories)
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await this.repository.findById(id);
    if (category?.isSystem) {
      throw new Error('Cannot delete system categories');
    }
    return this.repository.delete(id);
  }

  /**
   * Get count of expenses using a category for a user
   */
  async getExpenseCount(categoryId: string, userId: string): Promise<number> {
    return this.expenseRepo.countByCategory(categoryId, userId);
  }

  /**
   * Delete a category with replacement
   * Migrates all expenses from the deleted category to the replacement category
   * @returns The number of expenses migrated
   */
  async deleteCategoryWithReplacement(
    categoryId: string,
    replacementCategoryId: string,
    userId: string
  ): Promise<{ migratedCount: number }> {
    const category = await this.repository.findById(categoryId);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    if (category.isSystem) {
      throw new Error('Cannot delete system categories');
    }
    
    if (category.createdBy !== userId) {
      throw new Error('Cannot delete category created by another user');
    }

    // Migrate expenses to replacement category
    const migratedCount = await this.expenseRepo.migrateCategory(
      categoryId,
      replacementCategoryId,
      userId
    );

    // Delete the category
    await this.repository.delete(categoryId);

    return { migratedCount };
  }

  /**
   * Get multiple categories by IDs (batch query - single DB call)
   */
  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.findByIds(ids);
  }
}

// Singleton instance
export const categoryService = new CategoryService();

