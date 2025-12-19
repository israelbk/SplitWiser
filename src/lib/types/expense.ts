/**
 * Expense types
 */

export type SplitType = 'equal' | 'percentage' | 'shares' | 'exact';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: string;
  groupId?: string; // null = personal expense
  date: Date;
  createdBy: string;
  receiptUrl?: string;
  notes?: string;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  parentExpenseId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations (loaded separately)
  contributions?: ExpenseContribution[];
  splits?: ExpenseSplit[];
  category?: import('./category').Category;
}

// WHO PAID - Supports multiple payers per expense
export interface ExpenseContribution {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  // Populated relation
  user?: import('./user').User;
}

// WHO OWES - Supports multiple split strategies
export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  splitType: SplitType;
  percentage?: number;
  shares?: number;
  isSettled: boolean;
  settledAt?: Date;
  settledVia?: string;
  // Populated relation
  user?: import('./user').User;
}

// Recurrence (future feature)
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
}

// Payment configuration - who paid and how much
export interface PaymentEntry {
  userId: string;
  amount: number;
}

// Split configuration - who owes and how much
export interface SplitEntry {
  userId: string;
  amount: number;       // Calculated final amount
  percentage?: number;  // If split type is percentage
  shares?: number;      // If split type is shares
}

// Full split configuration for group expenses
export interface SplitConfiguration {
  // Payment: who paid
  payments: PaymentEntry[];
  // Split: who owes
  splitType: SplitType;
  splits: SplitEntry[];
}

// Input types for creating/updating
export interface CreateExpenseInput {
  description: string;
  amount: number;
  currency?: string;
  categoryId: string;
  groupId?: string;
  date: Date;
  createdBy: string;
  notes?: string;
  // Simple mode (legacy): single payer, equal split
  paidById?: string;
  splitAmongUserIds?: string[];
  // Advanced mode: full configuration
  splitConfig?: SplitConfiguration;
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  date?: Date;
  notes?: string;
}

// Database row types (snake_case)
export interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category_id: string;
  group_id: string | null;
  date: string;
  created_by: string;
  receipt_url: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  parent_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseContributionRow {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface ExpenseSplitRow {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  split_type: string;
  percentage: number | null;
  shares: number | null;
  is_settled: boolean;
  settled_at: string | null;
  settled_via: string | null;
}

// Transform database row to domain type
export function expenseFromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    categoryId: row.category_id,
    groupId: row.group_id ?? undefined,
    date: new Date(row.date),
    createdBy: row.created_by,
    receiptUrl: row.receipt_url ?? undefined,
    notes: row.notes ?? undefined,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule ?? undefined,
    parentExpenseId: row.parent_expense_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function contributionFromRow(row: ExpenseContributionRow): ExpenseContribution {
  return {
    id: row.id,
    expenseId: row.expense_id,
    userId: row.user_id,
    amount: Number(row.amount),
  };
}

export function splitFromRow(row: ExpenseSplitRow): ExpenseSplit {
  return {
    id: row.id,
    expenseId: row.expense_id,
    userId: row.user_id,
    amount: Number(row.amount),
    splitType: row.split_type as SplitType,
    percentage: row.percentage ?? undefined,
    shares: row.shares ?? undefined,
    isSettled: row.is_settled,
    settledAt: row.settled_at ? new Date(row.settled_at) : undefined,
    settledVia: row.settled_via ?? undefined,
  };
}

