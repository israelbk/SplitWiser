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
import { getCategoryIcon } from './category-badge';
import { cn } from '@/lib/utils';

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
  const { data: categories, isLoading } = useCategories();

  const selectedCategory = categories?.find((c) => c.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className={cn('w-full h-10', className)}>
        <SelectValue placeholder="Select category">
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
              <span className="truncate">{selectedCategory.name}</span>
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
                <span className="truncate">{category.name}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

