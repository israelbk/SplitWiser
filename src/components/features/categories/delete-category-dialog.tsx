'use client';

/**
 * Delete category dialog component
 * Prompts user to select a replacement category when deleting a category with expenses
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/lib/types';
import { getIconByName } from '@/lib/constants/icons';
import { cn } from '@/lib/utils';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  expenseCount: number;
  availableCategories: Category[];
  onConfirm: (replacementCategoryId: string) => void;
  isDeleting?: boolean;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  expenseCount,
  availableCategories,
  onConfirm,
  isDeleting,
}: DeleteCategoryDialogProps) {
  const t = useTranslations('categoryManager');
  const tCategories = useTranslations('categories');
  const [replacementId, setReplacementId] = useState<string>('');

  // Reset replacement selection when dialog opens with a new category
  useEffect(() => {
    if (open && category) {
      // Default to "Other" category if available
      const otherCategory = availableCategories.find(c => c.icon === 'more-horizontal');
      setReplacementId(otherCategory?.id ?? availableCategories[0]?.id ?? '');
    }
  }, [open, category, availableCategories]);

  const handleConfirm = () => {
    if (replacementId) {
      onConfirm(replacementId);
    }
  };

  // Get translated category name helper
  const getCategoryName = (cat: Category) => {
    if (cat.isSystem) {
      // System categories use translation keys based on icon
      const iconToKey: Record<string, string> = {
        'utensils': 'food',
        'car': 'transportation',
        'shopping-bag': 'shopping',
        'film': 'entertainment',
        'receipt': 'bills',
        'heart-pulse': 'health',
        'plane': 'travel',
        'shopping-cart': 'groceries',
        'home': 'housing',
        'more-horizontal': 'other',
      };
      const key = iconToKey[cat.icon];
      return key ? tCategories(key) : cat.name;
    }
    return cat.name;
  };

  if (!category) return null;

  const CategoryIcon = getIconByName(category.icon);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon className="h-4 w-4" style={{ color: category.color }} />
            </span>
            {t('deleteTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {expenseCount > 0
                  ? t('deleteWithExpenses', { 
                      name: category.name, 
                      count: expenseCount 
                    })
                  : t('deleteConfirm', { name: category.name })}
              </p>

              {expenseCount > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('selectReplacement')}
                  </label>
                  <Select value={replacementId} onValueChange={setReplacementId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories
                        .filter(c => c.id !== category.id)
                        .map((cat) => {
                          const Icon = getIconByName(cat.icon);
                          return (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <Icon
                                  className="h-4 w-4"
                                  style={{ color: cat.color }}
                                />
                                <span>{getCategoryName(cat)}</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || (expenseCount > 0 && !replacementId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

