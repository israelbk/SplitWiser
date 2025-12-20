'use client';

/**
 * All Expenses page
 * Main page showing all expenses (personal + group share)
 */

import { ExpenseForm } from '@/components/common';
import {
  ExpenseFilters,
  ExpenseFiltersBar,
  ExpenseList,
  ExpenseSummary,
} from '@/components/features/expenses';
import { AppShell } from '@/components/layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAllExpenses, useConvertedExpenses, useCreateExpense, useCurrencyPreferences, useDeleteExpense, useUpdateExpense } from '@/hooks/queries';
import { useCurrentUser, useAuth } from '@/hooks/use-current-user';
import { UnifiedExpense } from '@/lib/services';
import { isAfter, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function AllExpensesPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { canWrite } = useAuth();
  const { data: expenses, isLoading } = useAllExpenses(currentUser?.id);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  
  // Currency conversion
  const { displayCurrency, conversionMode } = useCurrencyPreferences();
  
  // Always fetch conversions for percentage calculation (using current rates when mode is 'off')
  // When mode is 'smart', use historical rates for both display and percentages
  const effectiveModeForConversion = conversionMode === 'smart' ? 'smart' : 'simple';
  const { conversions, isConverting } = useConvertedExpenses({
    expenses: expenses ?? [],
    conversionMode: effectiveModeForConversion,
    enabled: true, // Always fetch for percentage calculations
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<UnifiedExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<UnifiedExpense | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({ type: 'all' });

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return undefined;

    return expenses.filter((expense) => {
      // Type filter (personal/group/all)
      if (filters.type && filters.type !== 'all') {
        if (filters.type === 'personal' && !expense.isPersonal) {
          return false;
        }
        if (filters.type === 'group' && expense.isPersonal) {
          return false;
        }
      }

      // Category filter
      if (filters.categoryId && expense.categoryId !== filters.categoryId) {
        return false;
      }

      // Date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'week':
            startDate = startOfWeek(now);
            break;
          case 'month':
            startDate = startOfMonth(now);
            break;
          case 'year':
            startDate = startOfYear(now);
            break;
          default:
            startDate = new Date(0);
        }

        if (!isAfter(expense.date, startDate)) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filters]);

  // Handle clicking on an expense card
  const handleExpenseClick = (expense: UnifiedExpense) => {
    if (expense.isPersonal) {
      // Personal expense - open edit modal with pre-filled data
      setEditingExpense(expense);
      setIsFormOpen(true);
    } else if (expense.groupId) {
      // Group expense - navigate to the group page
      router.push(`/groups/${expense.groupId}`);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: UnifiedExpense) => {
    // Only allow editing personal expenses for now
    if (!expense.isPersonal) {
      toast.error(t('groupExpenseEditError'));
      return;
    }
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteExpense = (expense: UnifiedExpense) => {
    // Only allow deleting personal expenses for now
    if (!expense.isPersonal) {
      toast.error(t('groupExpenseDeleteError'));
      return;
    }
    setDeletingExpense(expense);
  };

  const handleFormSubmit = async (data: {
    description: string;
    amount: number;
    currency: string;
    categoryId: string;
    date: Date;
    notes?: string;
  }) => {
    if (!currentUser) return;

    try {
      if (editingExpense) {
        // Update existing expense
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          input: {
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            categoryId: data.categoryId,
            date: data.date,
            notes: data.notes,
          },
        });
        toast.success(t('expenseUpdated'));
      } else {
        // Create new expense
        await createExpense.mutateAsync({
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          categoryId: data.categoryId,
          date: data.date,
          notes: data.notes,
          createdBy: currentUser.id,
          paidById: currentUser.id,
          splitAmongUserIds: [currentUser.id], // Personal expense - only current user
        });
        toast.success(t('expenseAdded'));
      }
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error(t('failedToSave'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense || !currentUser) return;

    try {
      await deleteExpense.mutateAsync({
        id: deletingExpense.id,
        groupId: deletingExpense.groupId,
        createdBy: currentUser.id,
      });
      toast.success(t('expenseDeleted'));
      setDeletingExpense(null);
    } catch (error) {
      toast.error(t('failedToDelete'));
    }
  };

  return (
    <AppShell onAddClick={handleAddExpense}>
      <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <Button 
            onClick={handleAddExpense} 
            className="hidden sm:flex"
            disabled={!canWrite}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addPersonal')}
          </Button>
        </div>

        {/* Summary Card - shows user's actual spending */}
        <ExpenseSummary 
          expenses={filteredExpenses} 
          isLoading={isLoading || isConverting} 
          showUserShare={true}
          conversions={conversions}
          displayCurrency={displayCurrency}
          conversionMode={conversionMode}
        />

        {/* Filters with type filter enabled */}
        <ExpenseFiltersBar 
          filters={filters} 
          onChange={setFilters}
          showTypeFilter={true}
        />

        {/* Expense List - shows user's share */}
        <ExpenseList
          expenses={filteredExpenses}
          isLoading={isLoading || isConverting}
          onClick={handleExpenseClick}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onAddClick={handleAddExpense}
          showUserShare={true}
          conversions={conversions}
          conversionMode={conversionMode}
          emptyTitle={t('noExpenses')}
          emptyDescription={t('startTracking')}
        />
      </div>

      {/* Add/Edit Expense Form */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        expense={editingExpense ?? undefined}
        title={editingExpense ? t('editExpense') : t('addExpense')}
        isLoading={createExpense.isPending || updateExpense.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { description: deletingExpense?.description ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
