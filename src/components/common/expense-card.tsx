'use client';

/**
 * Expense card component
 * Displays a single expense with details
 * Supports currency conversion display
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/constants';
import { ExpenseWithDetails, UnifiedExpense } from '@/lib/services';
import { ConversionMode, ConvertedAmount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowRightLeft, MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import { CategoryBadge, getCategoryIcon } from './category-badge';
import { UserAvatar } from './user-avatar';

interface ExpenseCardProps {
  expense: ExpenseWithDetails | UnifiedExpense;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showPayer?: boolean;
  showUserShare?: boolean;  // Show user's portion instead of total
  currentUserId?: string;   // Required when showUserShare is true for ExpenseWithDetails
  className?: string;
  // Currency conversion props
  conversion?: ConvertedAmount | null;
  conversionMode?: ConversionMode;
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
  currentUserId,
  className,
  conversion,
  conversionMode = 'off',
}: ExpenseCardProps) {
  const payer = expense.contributions?.[0]?.user;
  const Icon = expense.category ? getCategoryIcon(expense.category.icon) : null;
  
  // Determine display amount
  const unified = isUnifiedExpense(expense);
  const isGroupExpense = unified ? !expense.isPersonal : !!expense.groupId;
  const groupName = unified ? expense.groupName : undefined;
  
  // Calculate user share from splits for ExpenseWithDetails
  const getUserShare = (): number => {
    if (unified) {
      return expense.userShare;
    }
    // For ExpenseWithDetails, find the user's split
    if (currentUserId && expense.splits) {
      const userSplit = expense.splits.find(s => s.userId === currentUserId);
      return userSplit?.amount ?? 0;
    }
    return expense.amount;
  };
  
  const userShareAmount = showUserShare && isGroupExpense ? getUserShare() : expense.amount;
  const baseAmount = showUserShare && isGroupExpense ? userShareAmount : expense.amount;

  // Check if conversion should be shown (only when mode is not 'off' AND conversion exists)
  const isConverted = conversionMode !== 'off' && conversion?.converted && conversion.converted.currency !== expense.currency;
  const displayAmount = isConverted ? conversion.converted!.amount : baseAmount;
  const displayCurrency = isConverted ? conversion.converted!.currency : expense.currency;

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
              <div className="font-semibold text-primary flex items-center justify-end gap-1">
                {isConverted && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <ConversionTooltip 
                          conversion={conversion!} 
                          mode={conversionMode} 
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {formatCurrency(displayAmount, displayCurrency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {isConverted ? (
                  <span>
                    {formatCurrency(baseAmount, expense.currency)} @ {conversion!.converted!.rate.toFixed(4)}
                  </span>
                ) : (
                  <span>
                    {Math.round((baseAmount / expense.amount) * 100)}% of {formatCurrency(expense.amount, expense.currency)}
                  </span>
                )}
              </div>
            </>
          ) : isConverted ? (
            <>
              <div className="font-semibold flex items-center justify-end gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <ConversionTooltip 
                        conversion={conversion!} 
                        mode={conversionMode} 
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {formatCurrency(displayAmount, displayCurrency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(baseAmount, expense.currency)} @ {conversion!.converted!.rate.toFixed(4)}
              </div>
            </>
          ) : (
            <div className="font-semibold">
              {formatCurrency(displayAmount, displayCurrency)}
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

/**
 * Tooltip content showing conversion details
 */
function ConversionTooltip({ 
  conversion, 
  mode 
}: { 
  conversion: ConvertedAmount; 
  mode: ConversionMode;
}) {
  if (!conversion.converted) return null;
  
  return (
    <div className="text-xs">
      <div className="font-medium mb-1">
        {mode === 'smart' ? 'Historical Rate' : 'Current Rate'}
      </div>
      <div>
        {formatCurrency(conversion.original.amount, conversion.original.currency)}
        {' → '}
        {formatCurrency(conversion.converted.amount, conversion.converted.currency)}
      </div>
      <div className="text-muted-foreground mt-1">
        Rate: {conversion.converted.rate.toFixed(4)}
        {mode === 'smart' && conversion.converted.rateDate && (
          <span> ({format(conversion.converted.rateDate, 'MMM d, yyyy')})</span>
        )}
      </div>
    </div>
  );
}
