'use client';

/**
 * Category badge component
 * Shows category with icon and color
 */

import { Badge } from '@/components/ui/badge';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/constants/icons';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

const iconSizes = {
  sm: 12,
  md: 14,
};

// Map icon names to translation keys
export const iconToTranslationKey: Record<string, string> = {
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

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const t = useTranslations('categories');
  const Icon = getIconByName(category.icon);
  
  // Get translated category name (only for system categories)
  const translationKey = iconToTranslationKey[category.icon];
  const categoryName = category.isSystem && translationKey 
    ? t(translationKey) 
    : category.name;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border-2 gap-1',
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: category.color,
        color: category.color,
        backgroundColor: `${category.color}15`,
      }}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {categoryName}
    </Badge>
  );
}

/**
 * Get icon component for a category
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  return getIconByName(iconName);
}

