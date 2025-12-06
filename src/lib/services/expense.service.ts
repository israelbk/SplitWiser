/**
 * Expense service
 * Business logic for expense operations
 */

import { expenseRepository, ExpenseRepository } from '../repositories';
import { categoryService } from './category.service';
import { userService } from './user.service';
import { 
  Expense, 
  ExpenseContribution,
  ExpenseSplit,
  CreateExpenseInput, 
  UpdateExpenseInput,
  Category,
  User,
} from '../types';

export interface ExpenseWithDetails extends Expense {
  category?: Category;
  contributions: (ExpenseContribution & { user?: User })[];
  splits: (ExpenseSplit & { user?: User })[];
}

// Unified expense view showing user's actual share
export interface UnifiedExpense extends ExpenseWithDetails {
  userShare: number;           // User's portion of the expense
  isPersonal: boolean;         // true if personal, false if group
  groupName?: string;          // Group name if group expense
}

export class ExpenseService {
  constructor(private repository: ExpenseRepository = expenseRepository) {}

  /**
   * Get personal expenses for a user
   */
  async getPersonalExpenses(userId: string): Promise<Expense[]> {
    return this.repository.findPersonalExpenses(userId);
  }

  /**
   * Get personal expenses with category details
   */
  async getPersonalExpensesWithDetails(userId: string): Promise<ExpenseWithDetails[]> {
    const expenses = await this.repository.findPersonalExpenses(userId);
    return this.enrichExpenses(expenses);
  }

  /**
   * Get expenses for a group
   */
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    return this.repository.findByGroupId(groupId);
  }

  /**
   * Get group expenses with all details
   */
  async getGroupExpensesWithDetails(groupId: string): Promise<ExpenseWithDetails[]> {
    const expenses = await this.repository.findByGroupId(groupId);
    return this.enrichExpenses(expenses);
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense | null> {
    return this.repository.findById(id);
  }

  /**
   * Get expense with all details
   */
  async getExpenseWithDetails(id: string): Promise<ExpenseWithDetails | null> {
    const expense = await this.repository.findById(id);
    if (!expense) return null;

    const [enriched] = await this.enrichExpenses([expense]);
    return enriched;
  }

  /**
   * Create a new expense
   */
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    return this.repository.createExpense(input);
  }

  /**
   * Update an expense
   */
  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    return this.repository.updateExpense(id, input);
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<void> {
    return this.repository.deleteExpense(id);
  }

  /**
   * Get contributions for an expense
   */
  async getExpenseContributions(expenseId: string): Promise<ExpenseContribution[]> {
    return this.repository.getContributions(expenseId);
  }

  /**
   * Get splits for an expense
   */
  async getExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
    return this.repository.getSplits(expenseId);
  }

  /**
   * Get ALL expenses for a user (personal + group) with their share calculated
   */
  async getAllUserExpenses(userId: string): Promise<UnifiedExpense[]> {
    const expenses = await this.repository.findAllUserExpenses(userId);
    const enriched = await this.enrichExpenses(expenses);
    
    // Import group service dynamically to avoid circular dependency
    const { groupService } = await import('./group.service');
    
    // Get all unique group IDs
    const groupIds = [...new Set(expenses.filter(e => e.groupId).map(e => e.groupId!))];
    const groups = await Promise.all(groupIds.map(id => groupService.getGroupById(id)));
    const groupMap = new Map(groups.filter(g => g !== null).map(g => [g!.id, g!]));

    // Map to unified expenses with user's share
    return enriched.map(expense => {
      // Find user's split to get their share
      const userSplit = expense.splits.find(s => s.userId === userId);
      const userShare = userSplit?.amount ?? expense.amount;
      
      const group = expense.groupId ? groupMap.get(expense.groupId) : undefined;
      
      return {
        ...expense,
        userShare,
        isPersonal: !expense.groupId,
        groupName: group?.name,
      };
    });
  }

  /**
   * Get total spending by category for a user
   */
  async getSpendingByCategory(userId: string): Promise<{ categoryId: string; total: number }[]> {
    const expenses = await this.repository.findPersonalExpenses(userId);
    
    const byCategory = expenses.reduce((acc, expense) => {
      const key = expense.categoryId;
      acc[key] = (acc[key] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byCategory).map(([categoryId, total]) => ({
      categoryId,
      total,
    }));
  }

  /**
   * Get total spending for a user in a date range
   */
  async getTotalSpending(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const expenses = await this.repository.findPersonalExpenses(userId);
    
    return expenses
      .filter((expense) => {
        if (startDate && expense.date < startDate) return false;
        if (endDate && expense.date > endDate) return false;
        return true;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Enrich expenses with category and user details
   */
  private async enrichExpenses(expenses: Expense[]): Promise<ExpenseWithDetails[]> {
    // Get unique category IDs
    const categoryIds = [...new Set(expenses.map((e) => e.categoryId))];
    const categories = await categoryService.getCategoriesByIds(categoryIds);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Get contributions and splits for all expenses
    const enriched = await Promise.all(
      expenses.map(async (expense) => {
        const contributions = await this.repository.getContributions(expense.id);
        const splits = await this.repository.getSplits(expense.id);

        // Get unique user IDs from contributions and splits
        const userIds = [
          ...new Set([
            ...contributions.map((c) => c.userId),
            ...splits.map((s) => s.userId),
          ]),
        ];
        const users = await userService.getUsersByIds(userIds);
        const userMap = new Map(users.map((u) => [u.id, u]));

        return {
          ...expense,
          category: categoryMap.get(expense.categoryId),
          contributions: contributions.map((c) => ({
            ...c,
            user: userMap.get(c.userId),
          })),
          splits: splits.map((s) => ({
            ...s,
            user: userMap.get(s.userId),
          })),
        };
      })
    );

    return enriched;
  }
}

// Singleton instance
export const expenseService = new ExpenseService();

