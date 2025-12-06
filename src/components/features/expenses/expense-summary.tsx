'use client';

/**
 * Expense summary component
 * Shows total spending and category breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants';
import { ExpenseWithDetails, UnifiedExpense } from '@/lib/services';
import { getCategoryIcon } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Wallet, Users } from 'lucide-react';

type ExpenseType = ExpenseWithDetails | UnifiedExpense;

// Type guard
function isUnifiedExpense(expense: ExpenseType): expense is UnifiedExpense {
  return 'userShare' in expense;
}

interface ExpenseSummaryProps {
  expenses: ExpenseType[] | undefined;
  isLoading: boolean;
  currency?: string;
  showUserShare?: boolean;  // Use userShare for totals
}

export function ExpenseSummary({
  expenses,
  isLoading,
  currency = 'ILS',
  showUserShare = false,
}: ExpenseSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return null;
  }

  // Helper to get display amount
  const getAmount = (expense: ExpenseType) => {
    if (showUserShare && isUnifiedExpense(expense)) {
      return expense.userShare;
    }
    return expense.amount;
  };

  // Calculate total
  const total = expenses.reduce((sum, e) => sum + getAmount(e), 0);

  // Calculate personal vs group breakdown (for unified view)
  const personalTotal = expenses.reduce((sum, e) => {
    if (isUnifiedExpense(e) && e.isPersonal) {
      return sum + e.userShare;
    } else if (!isUnifiedExpense(e) && !e.groupId) {
      return sum + e.amount;
    }
    return sum;
  }, 0);
  const groupTotal = total - personalTotal;

  // Calculate by category
  const byCategory = expenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId;
    const category = expense.category;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category,
        total: 0,
        count: 0,
      };
    }
    acc[categoryId].total += getAmount(expense);
    acc[categoryId].count += 1;
    return acc;
  }, {} as Record<string, { category: typeof expenses[0]['category']; total: number; count: number }>);

  // Sort by total
  const sortedCategories = Object.values(byCategory).sort((a, b) => b.total - a.total);

  // Calculate this month vs last month (simplified for POC)
  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + getAmount(e), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {showUserShare ? 'Your Total Spending' : 'Total Spending'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatCurrency(total, currency)}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} •{' '}
          {formatCurrency(thisMonthTotal, currency)} this month
        </p>
        
        {/* Personal vs Group breakdown */}
        {showUserShare && (personalTotal > 0 || groupTotal > 0) && (
          <div className="flex gap-4 text-xs mb-4 pb-3 border-b">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Personal: {formatCurrency(personalTotal, currency)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Group: {formatCurrency(groupTotal, currency)}
            </span>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="space-y-2">
          {sortedCategories.slice(0, 4).map(({ category, total: categoryTotal, count }) => {
            const Icon = category ? getCategoryIcon(category.icon) : null;
            const percentage = ((categoryTotal / total) * 100).toFixed(0);

            return (
              <div key={category?.id || 'other'} className="flex items-center gap-2">
                {Icon && (
                  <Icon
                    size={16}
                    style={{ color: category?.color || '#6b7280' }}
                  />
                )}
                <span className="text-sm truncate flex-1">
                  {category?.name || 'Other'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {percentage}%
                </span>
                <span className="text-sm font-medium w-20 text-right">
                  {formatCurrency(categoryTotal, currency)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

