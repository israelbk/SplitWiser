/**
 * Predefined system categories
 * These match the seed data in the database
 */

import type { Category } from '../types';

export const SYSTEM_CATEGORIES: Omit<Category, 'createdBy'>[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Food & Dining',
    icon: 'utensils',
    color: '#f97316',
    isSystem: true,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Transport',
    icon: 'car',
    color: '#3b82f6',
    isSystem: true,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Entertainment',
    icon: 'film',
    color: '#a855f7',
    isSystem: true,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Shopping',
    icon: 'shopping-bag',
    color: '#ec4899',
    isSystem: true,
    sortOrder: 4,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Bills & Utilities',
    icon: 'receipt',
    color: '#64748b',
    isSystem: true,
    sortOrder: 5,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Health',
    icon: 'heart-pulse',
    color: '#ef4444',
    isSystem: true,
    sortOrder: 6,
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Travel',
    icon: 'plane',
    color: '#06b6d4',
    isSystem: true,
    sortOrder: 7,
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#22c55e',
    isSystem: true,
    sortOrder: 8,
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    name: 'Housing',
    icon: 'home',
    color: '#8b5cf6',
    isSystem: true,
    sortOrder: 9,
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Other',
    icon: 'more-horizontal',
    color: '#6b7280',
    isSystem: true,
    sortOrder: 10,
  },
];

export const DEFAULT_CATEGORY_ID = '00000000-0000-0000-0000-000000000010';

/**
 * Get category by ID from the predefined list
 */
export function getSystemCategory(id: string) {
  return SYSTEM_CATEGORIES.find((c) => c.id === id);
}

