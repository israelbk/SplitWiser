'use client';

/**
 * Category picker component
 * Dropdown selector for expense categories
 * For group expenses, only shows system categories
 * For personal expenses, shows system + user's custom categories with option to create new
 */

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserCategories, useSystemCategories } from '@/hooks/queries';
import { useAuth } from '@/hooks/use-current-user';
import { getCategoryIcon, iconToTranslationKey } from './category-badge';
import { CreateCategoryDialog } from '@/components/features/categories';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** When true, only shows system categories (for group expenses) */
  isGroupExpense?: boolean;
}

// Special value to trigger create dialog
const CREATE_NEW_VALUE = '__create_new__';

export function CategoryPicker({
  value,
  onChange,
  className,
  disabled,
  isGroupExpense = false,
}: CategoryPickerProps) {
  const t = useTranslations('categories');
  const tForm = useTranslations('expenseForm');
  const tManager = useTranslations('categoryManager');
  const { effectiveUser } = useAuth();
  const userId = effectiveUser?.id;

  // State for create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Use system categories for group expenses, user categories for personal
  const { data: userCategories, isLoading: isLoadingUser } = useUserCategories(
    isGroupExpense ? undefined : userId
  );
  const { data: systemCategories, isLoading: isLoadingSystem } = useSystemCategories();

  const categories = isGroupExpense ? systemCategories : userCategories;
  const isLoading = isGroupExpense ? isLoadingSystem : isLoadingUser;

  const selectedCategory = categories?.find((c) => c.id === value);
  
  // Helper to get translated category name
  const getCategoryName = (icon: string, fallbackName: string, isSystem: boolean) => {
    // Only translate system categories
    if (isSystem) {
      const key = iconToTranslationKey[icon];
      return key ? t(key) : fallbackName;
    }
    return fallbackName;
  };

  // Handle value change - intercept "create new" selection
  const handleValueChange = (newValue: string) => {
    if (newValue === CREATE_NEW_VALUE) {
      setCreateDialogOpen(true);
      return;
    }
    onChange(newValue);
  };

  // Handle category created - select it automatically
  const handleCategoryCreated = (categoryId: string) => {
    onChange(categoryId);
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange} disabled={disabled || isLoading}>
        <SelectTrigger className={cn('w-full h-10', className)}>
          <SelectValue placeholder={tForm('category')}>
            {selectedCategory && (
              <span className="flex items-center gap-2">
                {(() => {
                  const Icon = getCategoryIcon(selectedCategory.icon);
                  return (
                    <Icon
                      size={16}
                      style={{ color: selectedCategory.color }}
                    />
                  );
                })()}
                <span className="truncate">
                  {getCategoryName(selectedCategory.icon, selectedCategory.name, selectedCategory.isSystem)}
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories?.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <Icon size={16} style={{ color: category.color }} />
                  <span className="truncate">
                    {getCategoryName(category.icon, category.name, category.isSystem)}
                  </span>
                </span>
              </SelectItem>
            );
          })}

          {/* Create new category option - only for personal expenses */}
          {!isGroupExpense && (
            <>
              <SelectSeparator />
              <SelectItem value={CREATE_NEW_VALUE} className="text-primary">
                <span className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>{tManager('addCategory')}</span>
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      {/* Create category dialog */}
      <CreateCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}

