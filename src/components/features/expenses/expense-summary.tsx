'use client';

/**
 * Expense summary component
 * Shows total spending and category breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants';
import { ExpenseWithDetails } from '@/lib/services';
import { getCategoryIcon } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExpenseSummaryProps {
  expenses: ExpenseWithDetails[] | undefined;
  isLoading: boolean;
  currency?: string;
}

export function ExpenseSummary({
  expenses,
  isLoading,
  currency = 'ILS',
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

  // Calculate total
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

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
    acc[categoryId].total += expense.amount;
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
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Spending
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatCurrency(total, currency)}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} •{' '}
          {formatCurrency(thisMonthTotal, currency)} this month
        </p>

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

