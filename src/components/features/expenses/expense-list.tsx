'use client';

/**
 * Expense list component
 * Displays a list of expenses with optional filtering
 */

import { EmptyState, ExpenseCard, ExpenseListSkeleton } from '@/components/common';
import { ExpenseWithDetails, UnifiedExpense } from '@/lib/services';
import { ConversionMode, ConvertedAmount } from '@/lib/types';
import { Receipt } from 'lucide-react';

type ExpenseType = ExpenseWithDetails | UnifiedExpense;

interface ExpenseListProps<T extends ExpenseType> {
  expenses: T[] | undefined;
  isLoading: boolean;
  onClick?: (expense: T) => void;
  onEdit?: (expense: T) => void;
  onDelete?: (expense: T) => void;
  showPayer?: boolean;
  showUserShare?: boolean;
  currentUserId?: string;  // Required when showUserShare is true
  emptyTitle?: string;
  emptyDescription?: string;
  onAddClick?: () => void;
  // Currency conversion props
  conversions?: Map<string, ConvertedAmount>;
  conversionMode?: ConversionMode;
}

export function ExpenseList<T extends ExpenseType>({
  expenses,
  isLoading,
  onClick,
  onEdit,
  onDelete,
  showPayer = false,
  showUserShare = false,
  currentUserId,
  emptyTitle = 'No expenses yet',
  emptyDescription = 'Add your first expense to start tracking.',
  onAddClick,
  conversions,
  conversionMode = 'off',
}: ExpenseListProps<T>) {
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
      {expenses.map((expense) => {
        const conversion = conversions?.get(expense.id);
        return (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onClick={onClick ? () => onClick(expense) : undefined}
            onEdit={onEdit ? () => onEdit(expense) : undefined}
            onDelete={onDelete ? () => onDelete(expense) : undefined}
            showPayer={showPayer}
            showUserShare={showUserShare}
            currentUserId={currentUserId}
            conversion={conversion}
            conversionMode={conversionMode}
          />
        );
      })}
    </div>
  );
}

