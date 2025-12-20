'use client';

/**
 * Group detail page
 * Shows group expenses and balances
 */

import { ExpenseForm, UserAvatar } from '@/components/common';
import { ExpenseList } from '@/components/features/expenses';
import { GroupBalances } from '@/components/features/groups';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateExpense,
  useDeleteExpense,
  useGroupExpenses,
  useGroupWithMembers,
  useUpdateExpense,
} from '@/hooks/queries';
import { useCurrentUser, useAuth } from '@/hooks/use-current-user';
import { ExpenseWithDetails } from '@/lib/services';
import { ArrowLeft, Plus, Receipt, Scale } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { currentUser } = useCurrentUser();
  const { canWrite } = useAuth();
  const { data: group, isLoading: groupLoading } = useGroupWithMembers(groupId);
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(groupId);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState('expenses');

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
    currency: string;
    categoryId: string;
    date: Date;
    notes?: string;
    splitConfig?: import('@/lib/types').SplitConfiguration;
  }) => {
    if (!currentUser || !group) return;

    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          input: {
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            categoryId: data.categoryId,
            date: data.date,
            notes: data.notes,
            splitConfig: data.splitConfig,  // Update splits when editing
          },
        });
        toast.success('Expense updated');
      } else {
        // Use split config if provided (advanced mode), otherwise fallback to simple mode
        if (data.splitConfig) {
          await createExpense.mutateAsync({
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            categoryId: data.categoryId,
            date: data.date,
            notes: data.notes,
            groupId: groupId,
            createdBy: currentUser.id,
            splitConfig: data.splitConfig,
          });
        } else {
          // Fallback: simple mode with equal split
          const memberIds = group.members.map((m) => m.userId);
          await createExpense.mutateAsync({
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            categoryId: data.categoryId,
            date: data.date,
            notes: data.notes,
            groupId: groupId,
            createdBy: currentUser.id,
            paidById: currentUser.id,
            splitAmongUserIds: memberIds,
          });
        }
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

  if (groupLoading) {
    return (
      <AppShell>
        <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="mt-6 space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell>
        <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Group not found</p>
          <Button variant="link" onClick={() => router.push('/groups')}>
            Back to groups
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell onAddClick={handleAddExpense}>
      <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/groups')}
            className="flex-shrink-0 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-muted-foreground truncate">
                {group.description}
              </p>
            )}
            {/* Member Avatars */}
            <div className="flex items-center mt-2 -space-x-2">
              {group.members.slice(0, 5).map((member) => (
                <UserAvatar
                  key={member.userId}
                  user={member.user}
                  size="sm"
                  className="ring-2 ring-background"
                />
              ))}
              {group.members.length > 5 && (
                <span className="text-xs text-muted-foreground ml-2">
                  +{group.members.length - 5}
                </span>
              )}
            </div>
          </div>
          <Button 
            onClick={handleAddExpense} 
            className="hidden sm:flex"
            disabled={!canWrite}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="expenses" className="flex-1 sm:flex-none gap-2">
              <Receipt className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex-1 sm:flex-none gap-2">
              <Scale className="h-4 w-4" />
              Balances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-4">
            <ExpenseList
              expenses={expenses}
              isLoading={expensesLoading}
              onClick={handleEditExpense}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              showPayer={true}
              showUserShare={true}
              currentUserId={currentUser?.id}
              emptyTitle="No expenses in this group"
              emptyDescription="Add the first expense to start splitting costs."
              onAddClick={handleAddExpense}
            />
          </TabsContent>

          <TabsContent value="balances" className="mt-4">
            <GroupBalances groupId={groupId} currency={group.defaultCurrency} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Expense Form */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        expense={editingExpense ?? undefined}
        title={editingExpense ? 'Edit Expense' : 'Add Group Expense'}
        description={editingExpense ? 'Update the expense details.' : 'Configure who paid and how to split.'}
        isLoading={createExpense.isPending || updateExpense.isPending}
        groupMembers={group?.members.map(m => m.user).filter((u): u is NonNullable<typeof u> => !!u)}
        currentUserId={currentUser?.id}
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
              This will affect the group balance calculations.
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

