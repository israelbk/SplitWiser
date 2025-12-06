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
}

// Singleton instance
export const categoryRepository = new CategoryRepository();

