'use client';

/**
 * Category badge component
 * Shows category with icon and color
 */

import { Badge } from '@/components/ui/badge';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  Plane,
  ShoppingCart,
  Home,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

// Map icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  film: Film,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  'heart-pulse': HeartPulse,
  plane: Plane,
  'shopping-cart': ShoppingCart,
  home: Home,
  'more-horizontal': MoreHorizontal,
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

const iconSizes = {
  sm: 12,
  md: 14,
};

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const Icon = iconMap[category.icon] || MoreHorizontal;

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
      {category.name}
    </Badge>
  );
}

/**
 * Get icon component for a category
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || MoreHorizontal;
}

