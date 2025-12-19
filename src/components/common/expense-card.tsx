'use client';

/**
 * Expense card component
 * Displays a single expense with details
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CategoryBadge, getCategoryIcon } from './category-badge';
import { UserAvatar } from './user-avatar';
import { ExpenseWithDetails, UnifiedExpense } from '@/lib/services';
import { MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ExpenseCardProps {
  expense: ExpenseWithDetails | UnifiedExpense;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showPayer?: boolean;
  showUserShare?: boolean;  // Show user's portion instead of total
  className?: string;
}

// Type guard to check if expense is a UnifiedExpense
function isUnifiedExpense(expense: ExpenseWithDetails | UnifiedExpense): expense is UnifiedExpense {
  return 'userShare' in expense;
}

export function ExpenseCard({
  expense,
  onClick,
  onEdit,
  onDelete,
  showPayer = false,
  showUserShare = false,
  className,
}: ExpenseCardProps) {
  const payer = expense.contributions?.[0]?.user;
  const Icon = expense.category ? getCategoryIcon(expense.category.icon) : null;
  
  // Determine display amount
  const unified = isUnifiedExpense(expense);
  const displayAmount = showUserShare && unified ? expense.userShare : expense.amount;
  const isGroupExpense = unified ? !expense.isPersonal : !!expense.groupId;
  const groupName = unified ? expense.groupName : undefined;

  const handleCardClick = () => {
    onClick?.();
  };

  return (
    <Card
      className={cn(
        'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3">
        {/* Category Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: expense.category
              ? `${expense.category.color}20`
              : '#f1f5f9',
          }}
        >
          {Icon && (
            <Icon
              size={20}
              style={{ color: expense.category?.color || '#64748b' }}
            />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{expense.description}</h4>
            {isGroupExpense && (
              <Badge variant="secondary" className="flex-shrink-0 text-xs gap-1">
                <Users className="h-3 w-3" />
                {groupName || 'Group'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(expense.date, 'MMM d')}</span>
            {showPayer && payer && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserAvatar user={payer} size="sm" />
                  <span className="truncate">{payer.name}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          {showUserShare && isGroupExpense ? (
            <>
              <div className="font-semibold text-primary">
                {formatCurrency(displayAmount, expense.currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round((displayAmount / expense.amount) * 100)}% of {formatCurrency(expense.amount, expense.currency)}
              </div>
            </>
          ) : (
            <div className="font-semibold">
              {formatCurrency(displayAmount, expense.currency)}
            </div>
          )}
          {expense.category && (
            <CategoryBadge category={expense.category} size="sm" showIcon={false} />
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}

