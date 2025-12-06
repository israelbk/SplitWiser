/**
 * Category service
 * Business logic for category operations
 */

import { categoryRepository, CategoryRepository } from '../repositories';
import { Category, CreateCategoryInput, UpdateCategoryInput } from '../types';

export class CategoryService {
  constructor(private repository: CategoryRepository = categoryRepository) {}

  /**
   * Get all categories ordered by sort order
   */
  async getAllCategories(): Promise<Category[]> {
    return this.repository.findAllOrdered();
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
   * Create a custom category
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    return this.repository.createCategory({
      ...input,
      isSystem: false, // Custom categories are never system categories
    });
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
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
   * Get multiple categories by IDs
   */
  async getCategoriesByIds(ids: string[]): Promise<Category[]> {
    const categories = await Promise.all(
      ids.map((id) => this.repository.findById(id))
    );
    return categories.filter((c): c is Category => c !== null);
  }
}

// Singleton instance
export const categoryService = new CategoryService();

