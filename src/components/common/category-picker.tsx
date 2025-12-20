'use client';

/**
 * Category picker component
 * Dropdown selector for expense categories
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/queries';
import { getCategoryIcon, iconToTranslationKey } from './category-badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  className,
  disabled,
}: CategoryPickerProps) {
  const t = useTranslations('categories');
  const tForm = useTranslations('expenseForm');
  const { data: categories, isLoading } = useCategories();

  const selectedCategory = categories?.find((c) => c.id === value);
  
  // Helper to get translated category name
  const getCategoryName = (icon: string, fallbackName: string) => {
    const key = iconToTranslationKey[icon];
    return key ? t(key) : fallbackName;
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
              <span className="truncate">{getCategoryName(selectedCategory.icon, selectedCategory.name)}</span>
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
                <span className="truncate">{getCategoryName(category.icon, category.name)}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

