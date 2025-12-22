'use client';

/**
 * Expense card component
 * Displays a single expense with details
 * Supports currency conversion display
 * Mobile-first design with progressive enhancement for desktop
 * Long-press to show edit/delete options
 */

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ArrowRightLeft, Pencil, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { CategoryBadge, getCategoryIcon } from './category-badge';
import { UserAvatar } from './user-avatar';

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

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
  const t = useTranslations('expenseCard');
  const tCommon = useTranslations('common');
  
  // Long press state
  const [showActionDialog, setShowActionDialog] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  
  const payer = expense.contributions?.[0]?.user;
  const Icon = expense.category ? getCategoryIcon(expense.category.icon) : null;
  
  // Determine display amount
  const unified = isUnifiedExpense(expense);
  const isGroupExpense = unified ? !expense.isPersonal : !!expense.groupId;
  const groupName = unified ? expense.groupName : undefined;
  
  // Calculate user's contribution (what they paid) and split (what they owe)
  const getUserContribution = (): number => {
    if (!currentUserId || !expense.contributions) return 0;
    return expense.contributions
      .filter(c => c.userId === currentUserId)
      .reduce((sum, c) => sum + c.amount, 0);
  };
  
  const getUserSplit = (): number => {
    if (unified) {
      return expense.userShare;
    }
    if (currentUserId && expense.splits) {
      const userSplit = expense.splits.find(s => s.userId === currentUserId);
      return userSplit?.amount ?? 0;
    }
    return expense.amount;
  };
  
  // User's balance for this expense: positive = lent (get back), negative = borrowed (owe)
  const userContribution = getUserContribution();
  const userSplitAmount = getUserSplit();
  const userBalance = isGroupExpense && currentUserId ? userContribution - userSplitAmount : 0;
  
  // Get payer info for display
  const getPayerDisplay = (): { name: string; isCurrentUser: boolean } | null => {
    if (!expense.contributions?.length) return null;
    const totalPayers = expense.contributions.length;
    const firstPayer = expense.contributions[0];
    
    if (totalPayers === 1) {
      const isCurrentUser = firstPayer.userId === currentUserId;
      return {
        name: isCurrentUser ? tCommon('you') : (firstPayer.user?.name || 'Unknown'),
        isCurrentUser,
      };
    }
    // Multiple payers - show first payer name
    const isCurrentUser = firstPayer.userId === currentUserId;
    return {
      name: isCurrentUser ? tCommon('you') : (firstPayer.user?.name || 'Unknown'),
      isCurrentUser,
    };
  };
  
  const payerInfo = getPayerDisplay();
  
  const userShareAmount = showUserShare && isGroupExpense ? userSplitAmount : expense.amount;
  const baseAmount = showUserShare && isGroupExpense ? userShareAmount : expense.amount;

  // Check if conversion should be shown (only when mode is not 'off' AND conversion exists)
  const isConverted = conversionMode !== 'off' && conversion?.converted && conversion.converted.currency !== expense.currency;
  const displayAmount = isConverted ? conversion.converted!.amount : baseAmount;
  const displayCurrency = isConverted ? conversion.converted!.currency : expense.currency;
  
  // Calculate converted balance if conversion is active
  const displayBalance = isConverted && conversion?.converted
    ? userBalance * conversion.converted.rate
    : userBalance;

  // Long press handlers
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      // Trigger haptic feedback on mobile if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setShowActionDialog(true);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleCardClick = () => {
    // Only trigger click if it wasn't a long press
    if (!isLongPress.current) {
      onClick?.();
    }
    isLongPress.current = false;
  };

  // Mouse event handlers (for desktop long-press support)
  const handleMouseDown = () => {
    if (onEdit || onDelete) {
      startLongPress();
    }
  };

  const handleMouseUp = () => {
    clearLongPressTimer();
  };

  const handleMouseLeave = () => {
    clearLongPressTimer();
  };

  // Touch event handlers (for mobile long-press support)
  const handleTouchStart = () => {
    if (onEdit || onDelete) {
      startLongPress();
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
  };

  const handleTouchCancel = () => {
    clearLongPressTimer();
  };

  // Prevent context menu on long press
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onEdit || onDelete) {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* Long Press Action Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="max-w-[300px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center truncate">
              {expense.description}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('chooseAction')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {onEdit && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowActionDialog(false);
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
                {tCommon('edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  setShowActionDialog(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
                {tCommon('delete')}
              </Button>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full">{tCommon('cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card
        className={cn(
          'p-3 sm:p-4 hover:bg-accent/50 transition-colors cursor-pointer select-none',
          className
        )}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onContextMenu={handleContextMenu}
      >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Category Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-muted"
          style={expense.category ? {
            backgroundColor: `${expense.category.color}20`,
          } : undefined}
        >
          {Icon && (
            <Icon
              size={18}
              className="sm:hidden text-muted-foreground"
              style={expense.category?.color ? { color: expense.category.color } : undefined}
            />
          )}
          {Icon && (
            <Icon
              size={20}
              className="hidden sm:block text-muted-foreground"
              style={expense.category?.color ? { color: expense.category.color } : undefined}
            />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h4 className="font-medium truncate text-sm sm:text-base">{expense.description}</h4>
            {isGroupExpense && (
              <Badge variant="secondary" className="flex-shrink-0 text-[10px] sm:text-xs gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0 sm:py-0.5">
                <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">{groupName || 'Group'}</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>{format(expense.date, 'MMM d')}</span>
            {/* Payer info - hidden on mobile */}
            {showPayer && payer && (
              <span className="hidden sm:flex items-center gap-1.5">
                <span>•</span>
                <UserAvatar user={payer} size="sm" />
                <span className="truncate">{payer.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-end">
          {showUserShare && isGroupExpense ? (
            <>
              {/* User's share amount (what they owe from this expense) */}
              <div className="font-semibold text-sm sm:text-base flex items-center justify-end gap-1">
                {isConverted 
                  ? formatCurrency(userSplitAmount * conversion!.converted!.rate, displayCurrency)
                  : formatCurrency(userSplitAmount, expense.currency)
                }
                {isConverted && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground hidden sm:block" />
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
              </div>
            </>
          ) : isConverted ? (
            <>
              <div className="font-semibold flex items-center justify-end gap-1 text-sm sm:text-base">
                {formatCurrency(displayAmount, displayCurrency)}
                {/* Conversion icon - hidden on mobile */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground hidden sm:block" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <ConversionTooltip 
                        conversion={conversion!} 
                        mode={conversionMode} 
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/* Conversion details - hidden on mobile */}
              <div className="text-xs text-muted-foreground hidden sm:block">
                {formatCurrency(baseAmount, expense.currency)} @ {conversion!.converted!.rate.toFixed(4)}
              </div>
            </>
          ) : (
            <div className="font-semibold text-sm sm:text-base">
              {formatCurrency(displayAmount, displayCurrency)}
            </div>
          )}
          {/* Category badge - hidden on mobile */}
          {expense.category && (
            <div className="hidden sm:block">
              <CategoryBadge category={expense.category} size="sm" showIcon={false} />
            </div>
          )}
        </div>

      </div>
      </Card>
    </>
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
