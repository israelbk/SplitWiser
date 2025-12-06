'use client';

/**
 * Expense filters component
 * Filter expenses by category, date range, etc.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/queries';
import { getCategoryIcon } from '@/components/common';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExpenseFilters {
  categoryId?: string;
  dateRange?: 'all' | 'week' | 'month' | 'year';
}

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  className?: string;
}

export function ExpenseFiltersBar({
  filters,
  onChange,
  className,
}: ExpenseFiltersProps) {
  const { data: categories } = useCategories();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasFilters = filters.categoryId || (filters.dateRange && filters.dateRange !== 'all');

  const clearFilters = () => {
    onChange({ categoryId: undefined, dateRange: 'all' });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Filter Toggle Button (Mobile) */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="sm:hidden"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasFilters && (
            <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {[filters.categoryId, filters.dateRange !== 'all'].filter(Boolean).length}
            </span>
          )}
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div
        className={cn(
          'flex flex-col sm:flex-row gap-2',
          !isExpanded && 'hidden sm:flex'
        )}
      >
        {/* Category Filter */}
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={(value) =>
            onChange({ ...filters, categoryId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    <Icon size={16} style={{ color: category.color }} />
                    {category.name}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select
          value={filters.dateRange || 'all'}
          onValueChange={(value) =>
            onChange({ ...filters, dateRange: value as ExpenseFilters['dateRange'] })
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

