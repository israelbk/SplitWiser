'use client';

/**
 * Expense form component
 * Reusable form for creating/editing expenses
 */

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
import { DEFAULT_CATEGORY_ID } from '@/lib/constants';
import { Expense } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.date(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormData) => void;
  expense?: Partial<Expense>;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  expense,
  title = 'Add Expense',
  description = 'Enter the details of your expense.',
  isLoading = false,
}: ExpenseFormProps) {
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

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit(data);
  };

  // Reset form when dialog opens with new expense
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        description: expense?.description || '',
        amount: expense?.amount || 0,
        categoryId: expense?.categoryId || DEFAULT_CATEGORY_ID,
        date: expense?.date || new Date(),
        notes: expense?.notes || '',
      });
    }
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
                value={form.watch('amount')}
                onChange={(value) => form.setValue('amount', value)}
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

