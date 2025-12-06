/**
 * Category types
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  createdBy?: string;
  sortOrder: number;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  isSystem?: boolean;
  createdBy?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// Database row type (snake_case)
export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_system: boolean;
  created_by: string | null;
  sort_order: number;
}

// Transform database row to domain type
export function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isSystem: row.is_system,
    createdBy: row.created_by ?? undefined,
    sortOrder: row.sort_order,
  };
}

