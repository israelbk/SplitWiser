'use client';

/**
 * Expense form component
 * Reusable form for creating/editing expenses
 * Supports both personal expenses and group expenses with split configuration
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrencyPreferences } from '@/hooks/queries';
import { DEFAULT_CATEGORY_ID, DEFAULT_CURRENCY } from '@/lib/constants';
import { Expense, SplitConfiguration, User } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AmountInput } from './amount-input';
import { CategoryPicker } from './category-picker';
import { CurrencyPicker } from './currency-picker';
import { DatePicker } from './date-picker';
import { SplitConfig, SplitConfigTrigger } from './split-config';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
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
  onDelete?: () => void;  // Called when delete button is clicked
  expense?: Partial<Expense>;
  title?: string;
  description?: string;
  isLoading?: boolean;
  isDeleting?: boolean;  // Shows loading state on delete button
  // Group expense props
  groupMembers?: User[];
  currentUserId?: string;
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  expense,
  title,
  description,
  isLoading = false,
  isDeleting = false,
  groupMembers,
  currentUserId,
}: ExpenseFormProps) {
  const t = useTranslations('expenseForm');
  const tCommon = useTranslations('common');
  
  const isGroupExpense = !!groupMembers && groupMembers.length > 0 && !!currentUserId;
  
  // Determine title and description based on context
  const displayTitle = title ?? (expense?.id 
    ? t('editTitle') 
    : isGroupExpense 
      ? t('groupTitle') 
      : t('title'));
  const displayDescription = description ?? (expense?.id 
    ? t('editDescription') 
    : isGroupExpense 
      ? t('groupDescription') 
      : t('description'));
  
  // Get user's preferred display currency for default
  const { displayCurrency } = useCurrencyPreferences();
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      currency: expense?.currency || displayCurrency || DEFAULT_CURRENCY,
      categoryId: expense?.categoryId || DEFAULT_CATEGORY_ID,
      date: expense?.date || new Date(),
      notes: expense?.notes || '',
    },
  });

  // Split configuration state for group expenses
  const [splitConfig, setSplitConfig] = useState<SplitConfiguration | undefined>(undefined);
  
  // Control the split config sheet
  const [splitConfigOpen, setSplitConfigOpen] = useState(false);
  
  // Track current amount (synced with form but always up-to-date for SplitConfig)
  const [currentAmount, setCurrentAmount] = useState(expense?.amount || 0);

  // Reset form when expense prop changes (for edit mode) or when dialog opens
  useEffect(() => {
    if (open) {
      const initialAmount = expense?.amount || 0;
      
      form.reset({
        description: expense?.description || '',
        amount: initialAmount,
        currency: expense?.currency || displayCurrency || DEFAULT_CURRENCY,
        categoryId: expense?.categoryId || DEFAULT_CATEGORY_ID,
        date: expense?.date || new Date(),
        notes: expense?.notes || '',
      });
      
      // Update local amount state
      setCurrentAmount(initialAmount);
      
      // Initialize split config for group expenses
      if (isGroupExpense && groupMembers && currentUserId) {
        // Check if editing an existing expense with splits/contributions
        const hasExistingSplits = expense?.splits && expense.splits.length > 0;
        const hasExistingContributions = expense?.contributions && expense.contributions.length > 0;
        
        if (hasExistingSplits || hasExistingContributions) {
          // Restore split config from existing expense data
          const existingSplitType = expense.splits?.[0]?.splitType || 'equal';
          
          setSplitConfig({
            payments: hasExistingContributions 
              ? expense.contributions!.map(c => ({ userId: c.userId, amount: c.amount }))
              : [{ userId: currentUserId, amount: initialAmount }],
            splitType: existingSplitType,
            splits: hasExistingSplits
              ? expense.splits!.map(s => ({
                  userId: s.userId,
                  amount: s.amount,
                  percentage: s.percentage,
                  shares: s.shares,
                }))
              : groupMembers.map(m => ({
                  userId: m.id,
                  amount: initialAmount / groupMembers.length,
                })),
          });
        } else {
          // New expense: create default equal split
          const perPerson = initialAmount / groupMembers.length;
          setSplitConfig({
            payments: [{ userId: currentUserId, amount: initialAmount }],
            splitType: 'equal',
            splits: groupMembers.map(m => ({
              userId: m.id,
              amount: perPerson,
            })),
          });
        }
      } else {
        setSplitConfig(undefined);
      }
    }
  }, [open, expense, form, isGroupExpense, groupMembers, currentUserId, displayCurrency]);

  // Update split amounts when amount changes (for equal split type only)
  // Don't update while the split sheet is open - it manages its own state
  useEffect(() => {
    if (!open || !isGroupExpense || !splitConfig || currentAmount <= 0 || splitConfigOpen) return;
    if (splitConfig.splitType !== 'equal') return;
    
    const numPeople = splitConfig.splits.length || groupMembers?.length || 1;
    const perPerson = currentAmount / numPeople;
    
    setSplitConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        payments: prev.payments.length === 1
          ? [{ ...prev.payments[0], amount: currentAmount }]
          : prev.payments,
        splits: prev.splits.map(s => ({ ...s, amount: perPerson })),
      };
    });
  }, [currentAmount, open, isGroupExpense, splitConfig?.splitType, groupMembers?.length, splitConfigOpen]);

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit({
      ...data,
      splitConfig: isGroupExpense ? splitConfig : undefined,
    });
  };

  const currentCurrency = form.watch('currency');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[425px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">{displayTitle}</DialogTitle>
              <DialogDescription className="text-sm">{displayDescription}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              {/* Amount with Currency */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="amount" className="text-sm">{t('amount')}</Label>
                <div className="flex">
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <AmountInput
                        value={field.value}
                        onChange={(value) => {
                          setCurrentAmount(value); // Update local state
                          field.onChange(value); // Update form state
                        }}
                        currency={currentCurrency}
                        className="rounded-e-none flex-1 h-10"
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <CurrencyPicker
                        value={field.value}
                        onChange={field.onChange}
                        compact
                        className="rounded-s-none border-s-0 h-10"
                      />
                    )}
                  />
                </div>
                {form.formState.errors.amount && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {t('validation.amountPositive')}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-sm">{t('descriptionLabel')}</Label>
                <Input
                  id="description"
                  placeholder={t('descriptionPlaceholder')}
                  className="h-10"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {t('validation.descriptionRequired')}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm">{t('category')}</Label>
                <CategoryPicker
                  value={form.watch('categoryId')}
                  onChange={(value) => form.setValue('categoryId', value)}
                  isGroupExpense={isGroupExpense}
                />
                {form.formState.errors.categoryId && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {t('validation.categoryRequired')}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm">{t('date')}</Label>
                <DatePicker
                  value={form.watch('date')}
                  onChange={(date) => date && form.setValue('date', date)}
                />
                {form.formState.errors.date && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              {/* Notes (optional) */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="notes" className="text-sm">{t('notes')}</Label>
                <Input
                  id="notes"
                  placeholder={t('notesPlaceholder')}
                  className="h-10"
                  {...form.register('notes')}
                />
              </div>

              {/* Split Configuration Trigger (for group expenses) */}
              {isGroupExpense && groupMembers && currentUserId && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">{t('split')}</Label>
                  <SplitConfigTrigger
                    onClick={() => setSplitConfigOpen(true)}
                    config={splitConfig}
                    amount={currentAmount}
                    currentUserId={currentUserId}
                    members={groupMembers}
                    disabled={currentAmount <= 0}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {/* Delete button - only shown when editing */}
                {expense?.id && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onDelete}
                    disabled={isLoading || isDeleting}
                    className="w-full sm:w-auto h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? (
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="me-2 h-4 w-4" />
                    )}
                    {tCommon('delete')}
                  </Button>
                ) : (
                  <div className="hidden sm:block" /> // Spacer for alignment
                )}
                
                {/* Cancel and Submit buttons */}
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading || isDeleting}
                    className="w-full sm:w-auto h-10"
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading || isDeleting} className="w-full sm:w-auto h-10">
                    {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {expense?.id ? tCommon('update') : tCommon('add')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Split Configuration Sheet - rendered outside the Dialog */}
      {isGroupExpense && groupMembers && currentUserId && (
        <SplitConfig
          open={splitConfigOpen}
          onOpenChange={setSplitConfigOpen}
          amount={currentAmount}
          currentUserId={currentUserId}
          members={groupMembers}
          initialConfig={splitConfig}
          onSave={setSplitConfig}
        />
      )}
    </>
  );
}
