'use client';

/**
 * Expense list component
 * Displays a list of expenses with optional filtering
 */

import { ExpenseWithDetails } from '@/lib/services';
import { ExpenseCard, EmptyState, ExpenseListSkeleton } from '@/components/common';
import { Receipt } from 'lucide-react';

interface ExpenseListProps {
  expenses: ExpenseWithDetails[] | undefined;
  isLoading: boolean;
  onEdit?: (expense: ExpenseWithDetails) => void;
  onDelete?: (expense: ExpenseWithDetails) => void;
  showPayer?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onAddClick?: () => void;
}

export function ExpenseList({
  expenses,
  isLoading,
  onEdit,
  onDelete,
  showPayer = false,
  emptyTitle = 'No expenses yet',
  emptyDescription = 'Add your first expense to start tracking.',
  onAddClick,
}: ExpenseListProps) {
  if (isLoading) {
    return <ExpenseListSkeleton count={5} />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyTitle}
        description={emptyDescription}
        action={
          onAddClick
            ? {
                label: 'Add Expense',
                onClick: onAddClick,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit ? () => onEdit(expense) : undefined}
          onDelete={onDelete ? () => onDelete(expense) : undefined}
          showPayer={showPayer}
        />
      ))}
    </div>
  );
}

