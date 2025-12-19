/**
 * Balance calculation types
 */

import type { User } from './user';

/**
 * Balance for a single user in a group
 * Positive = others owe them
 * Negative = they owe others
 */
export interface UserBalance {
  userId: string;
  user?: User;
  totalPaid: number;      // Sum of all contributions
  totalOwes: number;      // Sum of all splits (what they should pay)
  netBalance: number;     // totalPaid - totalOwes
}

/**
 * A simplified debt between two users
 */
export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser?: User;
  toUser?: User;
}

/**
 * Complete balance summary for a group
 */
export interface GroupBalanceSummary {
  groupId: string;
  totalExpenses: number;
  userBalances: UserBalance[];
  simplifiedDebts: Debt[];  // Optimized list of who pays whom
  // Currency conversion info (when active)
  displayCurrency?: string;
  conversionMode?: 'off' | 'simple' | 'smart';
}

/**
 * Personal expense summary
 */
export interface PersonalExpenseSummary {
  userId: string;
  totalSpent: number;
  byCategory: CategorySpending[];
  byMonth: MonthlySpending[];
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface MonthlySpending {
  month: string; // YYYY-MM format
  amount: number;
}

