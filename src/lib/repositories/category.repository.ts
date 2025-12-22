/**
 * Category repository
 */

import { BaseRepository } from './base.repository';
import { 
  Category, 
  CategoryRow, 
  categoryFromRow,
  CreateCategoryInput,
  UpdateCategoryInput 
} from '../types';

interface CategoryCreateRow {
  name: string;
  icon: string;
  color: string;
  is_system?: boolean;
  created_by?: string;
  sort_order?: number;
}

interface CategoryUpdateRow {
  name?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export class CategoryRepository extends BaseRepository<CategoryRow, Category, CategoryCreateRow, CategoryUpdateRow> {
  constructor() {
    super('categories');
  }

  protected fromRow(row: CategoryRow): Category {
    return categoryFromRow(row);
  }

  /**
   * Get all categories ordered by sort_order
   */
  async findAllOrdered(): Promise<Category[]> {
    return this.findAll({
      orderBy: { column: 'sort_order', ascending: true },
    });
  }

  /**
   * Get only system categories
   */
  async findSystemCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_system', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch system categories: ${error.message}`);
    }

    return (data as CategoryRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get categories for a specific user (system + user's custom categories)
   * Returns system categories first, then user's custom categories by sort_order
   */
  async findByUser(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .or(`is_system.eq.true,created_by.eq.${userId}`)
      .order('is_system', { ascending: false }) // System first
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories for user: ${error.message}`);
    }

    return (data as CategoryRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get only custom categories for a specific user
   */
  async findCustomByUser(userId: string): Promise<Category[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_system', false)
      .eq('created_by', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch custom categories for user: ${error.message}`);
    }

    return (data as CategoryRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Create a category with domain input type
   */
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    return this.create({
      name: input.name,
      icon: input.icon,
      color: input.color,
      is_system: input.isSystem,
      created_by: input.createdBy,
      sort_order: input.sortOrder,
    });
  }

  /**
   * Update a category with domain input type
   */
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const updateData: CategoryUpdateRow = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    return this.update(id, updateData);
  }

  /**
   * Find multiple categories by IDs in a single query (batch)
   */
  async findByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to fetch categories by IDs: ${error.message}`);
    }

    return (data as CategoryRow[]).map(row => this.fromRow(row));
  }

  /**
   * Get the next sort order for a user's custom categories
   */
  async getNextSortOrder(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('sort_order')
      .eq('created_by', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to get next sort order: ${error.message}`);
    }

    // Start custom categories at sort_order 100+ to keep them after system categories
    const lastOrder = data?.[0]?.sort_order ?? 99;
    return lastOrder + 1;
  }

  /**
   * Update sort orders for multiple categories in batch
   * Used for drag-and-drop reordering
   */
  async updateSortOrders(updates: { id: string; sortOrder: number }[]): Promise<void> {
    if (updates.length === 0) return;

    // Supabase doesn't support batch updates in a single call,
    // so we execute them sequentially but could use a transaction via RPC
    const promises = updates.map(({ id, sortOrder }) =>
      this.client
        .from(this.tableName)
        .update({ sort_order: sortOrder })
        .eq('id', id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error(`Failed to update sort orders: ${errors[0].error?.message}`);
    }
  }
}

// Singleton instance
export const categoryRepository = new CategoryRepository();

