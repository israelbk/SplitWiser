'use client';

/**
 * Expense form component
 * Reusable form for creating/editing expenses
 * Supports both personal expenses and group expenses with split configuration
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryPicker } from './category-picker';
import { AmountInput } from './amount-input';
import { DatePicker } from './date-picker';
import { SplitConfig } from './split-config';
import { DEFAULT_CATEGORY_ID } from '@/lib/constants';
import { Expense, User, SplitConfiguration } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.date(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export interface ExpenseFormSubmitData extends ExpenseFormData {
  splitConfig?: SplitConfiguration;
}

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormSubmitData) => void;
  expense?: Partial<Expense>;
  title?: string;
  description?: string;
  isLoading?: boolean;
  // Group expense props
  groupMembers?: User[];
  currentUserId?: string;
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  expense,
  title = 'Add Expense',
  description = 'Enter the details of your expense.',
  isLoading = false,
  groupMembers,
  currentUserId,
}: ExpenseFormProps) {
  const isGroupExpense = !!groupMembers && groupMembers.length > 0 && !!currentUserId;
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      categoryId: expense?.categoryId || DEFAULT_CATEGORY_ID,
      date: expense?.date || new Date(),
      notes: expense?.notes || '',
    },
  });

  // Split configuration state for group expenses
  const [splitConfig, setSplitConfig] = useState<SplitConfiguration | undefined>(undefined);

  // Reset form when expense prop changes (for edit mode) or when dialog opens
  useEffect(() => {
    if (open) {
      const initialAmount = expense?.amount || 0;
      form.reset({
        description: expense?.description || '',
        amount: initialAmount,
        categoryId: expense?.categoryId || DEFAULT_CATEGORY_ID,
        date: expense?.date || new Date(),
        notes: expense?.notes || '',
      });
      
      // Reset split config for group expenses
      if (isGroupExpense && groupMembers && currentUserId) {
        const perPerson = initialAmount / groupMembers.length;
        setSplitConfig({
          payments: [{ userId: currentUserId, amount: initialAmount }],
          splitType: 'equal',
          splits: groupMembers.map(m => ({
            userId: m.id,
            amount: perPerson,
          })),
        });
      } else {
        setSplitConfig(undefined);
      }
    }
  }, [open, expense, form, isGroupExpense, groupMembers, currentUserId]);

  // Watch the amount for reactive updates
  const watchedAmount = form.watch('amount');

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit({
      ...data,
      splitConfig: isGroupExpense ? splitConfig : undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <AmountInput
                value={watchedAmount}
                onChange={(value) => form.setValue('amount', value, { shouldDirty: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <CategoryPicker
                value={form.watch('categoryId')}
                onChange={(value) => form.setValue('categoryId', value)}
              />
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={form.watch('date')}
                onChange={(date) => date && form.setValue('date', date)}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Add any additional notes..."
                {...form.register('notes')}
              />
            </div>

            {/* Split Configuration (for group expenses) */}
            {isGroupExpense && groupMembers && currentUserId && (
              <div className="space-y-2">
                <Label>Split</Label>
                <SplitConfig
                  amount={watchedAmount}
                  currentUserId={currentUserId}
                  members={groupMembers}
                  value={splitConfig}
                  onChange={setSplitConfig}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

