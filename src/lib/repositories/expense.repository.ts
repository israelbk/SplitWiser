/**
 * Expense repository
 */

import { BaseRepository } from './base.repository';
import { 
  Expense, 
  ExpenseRow, 
  expenseFromRow,
  ExpenseContribution,
  ExpenseContributionRow,
  contributionFromRow,
  ExpenseSplit,
  ExpenseSplitRow,
  splitFromRow,
  CreateExpenseInput,
  UpdateExpenseInput,
  SplitType,
} from '../types';
import { DEFAULT_CURRENCY } from '../constants';

interface ExpenseCreateRow {
  description: string;
  amount: number;
  currency?: string;
  category_id: string;
  group_id?: string;
  date: string;
  created_by: string;
  notes?: string;
}

interface ExpenseUpdateRow {
  description?: string;
  amount?: number;
  currency?: string;
  category_id?: string;
  date?: string;
  notes?: string;
  updated_at?: string;
}

interface ContributionCreateRow {
  expense_id: string;
  user_id: string;
  amount: number;
}

interface SplitCreateRow {
  expense_id: string;
  user_id: string;
  amount: number;
  split_type: string;
  percentage?: number;
  shares?: number;
}

export class ExpenseRepository extends BaseRepository<ExpenseRow, Expense, ExpenseCreateRow, ExpenseUpdateRow> {
  constructor() {
    super('expenses');
  }

  protected fromRow(row: ExpenseRow): Expense {
    return expenseFromRow(row);
  }

  /**
   * Get personal expenses for a user (no group)
   */
  async findPersonalExpenses(userId: string): Promise<Expense[]> {
    // Find expenses created by this user that are not in a group
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('created_by', userId)
      .is('group_id', null)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch personal expenses: ${error.message}`);
    }

    return (data as ExpenseRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get all expenses for a group
   */
  async findByGroupId(groupId: string): Promise<Expense[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch group expenses: ${error.message}`);
    }

    return (data as ExpenseRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Create an expense with contributions and splits
   * Supports both simple mode (paidById + splitAmongUserIds) and advanced mode (splitConfig)
   */
  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    // Create the expense
    const { data: expenseData, error: expenseError } = await this.client
      .from(this.tableName)
      .insert({
        description: input.description,
        amount: input.amount,
        currency: input.currency ?? DEFAULT_CURRENCY,
        category_id: input.categoryId,
        group_id: input.groupId,
        date: input.date.toISOString().split('T')[0],
        created_by: input.createdBy,
        notes: input.notes,
      } as ExpenseCreateRow)
      .select()
      .single();

    if (expenseError) {
      throw new Error(`Failed to create expense: ${expenseError.message}`);
    }

    const expense = this.fromRow(expenseData as ExpenseRow);

    // Check if using advanced split configuration
    if (input.splitConfig) {
      // Advanced mode: use full split configuration
      const { payments, splits, splitType } = input.splitConfig;

      // Create contributions (who paid)
      for (const payment of payments) {
        await this.createContribution({
          expense_id: expense.id,
          user_id: payment.userId,
          amount: payment.amount,
        });
      }

      // Create splits (who owes)
      for (const split of splits) {
        await this.createSplit({
          expense_id: expense.id,
          user_id: split.userId,
          amount: split.amount,
          split_type: splitType,
          percentage: split.percentage,
          shares: split.shares,
        });
      }
    } else if (input.paidById && input.splitAmongUserIds) {
      // Simple mode: single payer, equal split (legacy/personal expenses)
      await this.createContribution({
        expense_id: expense.id,
        user_id: input.paidById,
        amount: input.amount,
      });

      const splitAmount = input.amount / input.splitAmongUserIds.length;
      for (const userId of input.splitAmongUserIds) {
        await this.createSplit({
          expense_id: expense.id,
          user_id: userId,
          amount: splitAmount,
          split_type: 'equal',
        });
      }
    }

    return expense;
  }

  /**
   * Update an expense
   */
  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const updateData: ExpenseUpdateRow = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.description !== undefined) updateData.description = input.description;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
    if (input.date !== undefined) updateData.date = input.date.toISOString().split('T')[0];
    if (input.notes !== undefined) updateData.notes = input.notes;

    const expense = await this.update(id, updateData);

    // Update splits and contributions if provided
    if (input.splitConfig) {
      const { payments, splits, splitType } = input.splitConfig;
      
      // Delete existing contributions and splits
      await this.deleteContributions(id);
      await this.deleteSplits(id);
      
      // Create new contributions (who paid)
      for (const payment of payments) {
        await this.createContribution({
          expense_id: id,
          user_id: payment.userId,
          amount: payment.amount,
        });
      }
      
      // Create new splits (who owes)
      for (const split of splits) {
        await this.createSplit({
          expense_id: id,
          user_id: split.userId,
          amount: split.amount,
          split_type: splitType,
          percentage: split.percentage,
          shares: split.shares,
        });
      }
    }

    return expense;
  }
  
  /**
   * Delete all contributions for an expense
   */
  private async deleteContributions(expenseId: string): Promise<void> {
    const { error } = await this.client
      .from('expense_contributions')
      .delete()
      .eq('expense_id', expenseId);
    
    if (error) {
      throw new Error(`Failed to delete contributions: ${error.message}`);
    }
  }
  
  /**
   * Delete all splits for an expense
   */
  private async deleteSplits(expenseId: string): Promise<void> {
    const { error } = await this.client
      .from('expense_splits')
      .delete()
      .eq('expense_id', expenseId);
    
    if (error) {
      throw new Error(`Failed to delete splits: ${error.message}`);
    }
  }

  /**
   * Delete an expense and its contributions/splits (cascade)
   */
  async deleteExpense(id: string): Promise<void> {
    // Contributions and splits are deleted via CASCADE
    return this.delete(id);
  }

  /**
   * Get contributions for an expense
   */
  async getContributions(expenseId: string): Promise<ExpenseContribution[]> {
    const { data, error } = await this.client
      .from('expense_contributions')
      .select('*')
      .eq('expense_id', expenseId);

    if (error) {
      throw new Error(`Failed to fetch contributions: ${error.message}`);
    }

    return (data as ExpenseContributionRow[]).map((row) => contributionFromRow(row));
  }

  /**
   * Get splits for an expense
   */
  async getSplits(expenseId: string): Promise<ExpenseSplit[]> {
    const { data, error } = await this.client
      .from('expense_splits')
      .select('*')
      .eq('expense_id', expenseId);

    if (error) {
      throw new Error(`Failed to fetch splits: ${error.message}`);
    }

    return (data as ExpenseSplitRow[]).map((row) => splitFromRow(row));
  }

  /**
   * Create a contribution
   */
  private async createContribution(input: ContributionCreateRow): Promise<ExpenseContribution> {
    const { data, error } = await this.client
      .from('expense_contributions')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contribution: ${error.message}`);
    }

    return contributionFromRow(data as ExpenseContributionRow);
  }

  /**
   * Create a split
   */
  private async createSplit(input: SplitCreateRow): Promise<ExpenseSplit> {
    const { data, error } = await this.client
      .from('expense_splits')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create split: ${error.message}`);
    }

    return splitFromRow(data as ExpenseSplitRow);
  }

  /**
   * Get all expenses where a user has a split (both personal and group)
   */
  async findAllUserExpenses(userId: string): Promise<Expense[]> {
    // Get expense IDs where user has a split
    const { data: splitData, error: splitError } = await this.client
      .from('expense_splits')
      .select('expense_id')
      .eq('user_id', userId);

    if (splitError) {
      throw new Error(`Failed to fetch user splits: ${splitError.message}`);
    }

    if (!splitData || splitData.length === 0) {
      return [];
    }

    const expenseIds = splitData.map((s) => s.expense_id);

    // Get all those expenses
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', expenseIds)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user expenses: ${error.message}`);
    }

    return (data as ExpenseRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get user's split for a specific expense
   */
  async getUserSplit(expenseId: string, userId: string): Promise<ExpenseSplit | null> {
    const { data, error } = await this.client
      .from('expense_splits')
      .select('*')
      .eq('expense_id', expenseId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch user split: ${error.message}`);
    }

    return splitFromRow(data as ExpenseSplitRow);
  }

  /**
   * Get all contributions for a group (for balance calculation)
   */
  async getGroupContributions(groupId: string): Promise<ExpenseContribution[]> {
    const { data, error } = await this.client
      .from('expense_contributions')
      .select('*, expenses!inner(group_id)')
      .eq('expenses.group_id', groupId);

    if (error) {
      throw new Error(`Failed to fetch group contributions: ${error.message}`);
    }

    return (data as ExpenseContributionRow[]).map((row) => contributionFromRow(row));
  }

  /**
   * Get all splits for a group (for balance calculation)
   */
  async getGroupSplits(groupId: string): Promise<ExpenseSplit[]> {
    const { data, error } = await this.client
      .from('expense_splits')
      .select('*, expenses!inner(group_id)')
      .eq('expenses.group_id', groupId);

    if (error) {
      throw new Error(`Failed to fetch group splits: ${error.message}`);
    }

    return (data as ExpenseSplitRow[]).map((row) => splitFromRow(row));
  }
}

// Singleton instance
export const expenseRepository = new ExpenseRepository();

