'use client';

/**
 * Personal expenses page
 * Main page for tracking personal spending
 */

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout';
import { ExpenseForm } from '@/components/common';
import {
  ExpenseList,
  ExpenseFiltersBar,
  ExpenseFilters,
  ExpenseSummary,
} from '@/components/features/expenses';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePersonalExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/queries';
import { ExpenseWithDetails } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
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

export default function PersonalExpensesPage() {
  const { currentUser } = useCurrentUser();
  const { data: expenses, isLoading } = usePersonalExpenses(currentUser?.id);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithDetails | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({});

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return undefined;

    return expenses.filter((expense) => {
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

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteExpense = (expense: ExpenseWithDetails) => {
    setDeletingExpense(expense);
  };

  const handleFormSubmit = async (data: {
    description: string;
    amount: number;
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
            categoryId: data.categoryId,
            date: data.date,
            notes: data.notes,
          },
        });
        toast.success('Expense updated');
      } else {
        // Create new expense
        await createExpense.mutateAsync({
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId,
          date: data.date,
          notes: data.notes,
          createdBy: currentUser.id,
          paidById: currentUser.id,
          splitAmongUserIds: [currentUser.id], // Personal expense - only current user
        });
        toast.success('Expense added');
      }
      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('Failed to save expense');
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
      toast.success('Expense deleted');
      setDeletingExpense(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <AppShell onAddClick={handleAddExpense}>
      <div className="container px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Personal Expenses</h1>
            <p className="text-sm text-muted-foreground">
              Track your daily spending
            </p>
          </div>
          <Button onClick={handleAddExpense} className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary Card */}
        <ExpenseSummary expenses={filteredExpenses} isLoading={isLoading} />

        {/* Filters */}
        <ExpenseFiltersBar filters={filters} onChange={setFilters} />

        {/* Expense List */}
        <ExpenseList
          expenses={filteredExpenses}
          isLoading={isLoading}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onAddClick={handleAddExpense}
          emptyTitle="No expenses yet"
          emptyDescription="Start tracking your spending by adding your first expense."
        />
      </div>

      {/* Add/Edit Expense Form */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        expense={editingExpense ?? undefined}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        isLoading={createExpense.isPending || updateExpense.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingExpense?.description}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
