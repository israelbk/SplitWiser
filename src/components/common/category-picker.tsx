'use client';

/**
 * Category picker component
 * Dropdown selector for expense categories
 * For group expenses, only shows system categories
 * For personal expenses, shows system + user's custom categories
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserCategories, useSystemCategories } from '@/hooks/queries';
import { useAuth } from '@/hooks/use-current-user';
import { getCategoryIcon, iconToTranslationKey } from './category-badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** When true, only shows system categories (for group expenses) */
  isGroupExpense?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  className,
  disabled,
  isGroupExpense = false,
}: CategoryPickerProps) {
  const t = useTranslations('categories');
  const tForm = useTranslations('expenseForm');
  const { effectiveUser } = useAuth();
  const userId = effectiveUser?.id;

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

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
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
      </SelectContent>
    </Select>
  );
}

