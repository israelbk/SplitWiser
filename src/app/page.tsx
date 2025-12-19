'use client';

/**
 * All Expenses page
 * Main page showing all expenses (personal + group share)
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { ExpenseForm } from '@/components/common';
import {
  ExpenseList,
  ExpenseFiltersBar,
  ExpenseFilters,
  ExpenseSummary,
} from '@/components/features/expenses';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAllExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/queries';
import { UnifiedExpense } from '@/lib/services';
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

export default function AllExpensesPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { data: expenses, isLoading } = useAllExpenses(currentUser?.id);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

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
      toast.error('Group expenses can only be edited from the group page');
      return;
    }
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteExpense = (expense: UnifiedExpense) => {
    // Only allow deleting personal expenses for now
    if (!expense.isPersonal) {
      toast.error('Group expenses can only be deleted from the group page');
      return;
    }
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
            <h1 className="text-2xl font-bold">All Expenses</h1>
            <p className="text-sm text-muted-foreground">
              Personal + your share of group expenses
            </p>
          </div>
          <Button onClick={handleAddExpense} className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Add Personal
          </Button>
        </div>

        {/* Summary Card - shows user's actual spending */}
        <ExpenseSummary 
          expenses={filteredExpenses} 
          isLoading={isLoading} 
          showUserShare={true}
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
          isLoading={isLoading}
          onClick={handleExpenseClick}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onAddClick={handleAddExpense}
          showUserShare={true}
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
