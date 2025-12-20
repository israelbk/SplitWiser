'use client';

/**
 * Expense summary component
 * Shows total spending and category breakdown
 * Supports currency conversion display
 * 
 * Percentage calculation always converts to display currency using:
 * - Current rates when conversionMode is 'off' or 'simple'
 * - Historical rates when conversionMode is 'smart'
 */

import { getCategoryIcon } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/constants';
import { ExpenseWithDetails, UnifiedExpense } from '@/lib/services';
import { ConversionMode, ConvertedAmount } from '@/lib/types';
import { ArrowRightLeft, Users, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ExpenseType = ExpenseWithDetails | UnifiedExpense;

// Type guard
function isUnifiedExpense(expense: ExpenseType): expense is UnifiedExpense {
  return 'userShare' in expense;
}

interface ExpenseSummaryProps {
  expenses: ExpenseType[] | undefined;
  isLoading: boolean;
  currency?: string;
  showUserShare?: boolean;  // Use userShare for totals
  // Currency conversion props - conversions are ALWAYS provided for percentage calc
  conversions?: Map<string, ConvertedAmount>;
  conversionMode?: ConversionMode;
  displayCurrency?: string;
  isConverting?: boolean;
}

export function ExpenseSummary({
  expenses,
  isLoading,
  currency = 'ILS',
  showUserShare = false,
  conversions,
  conversionMode = 'off',
  displayCurrency,
  isConverting = false,
}: ExpenseSummaryProps) {
  const t = useTranslations();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return null;
  }

  // Determine the display currency
  const effectiveDisplayCurrency = displayCurrency || currency;
  
  // Whether to SHOW converted amounts (vs showing original currencies)
  const showConvertedAmounts = conversionMode !== 'off';
  
  // Whether we have conversions available for percentage calculation
  const hasConversions = conversions && conversions.size > 0;

  // Helper to get base amount (respecting userShare)
  const getBaseAmount = (expense: ExpenseType) => {
    return showUserShare && isUnifiedExpense(expense) 
      ? expense.userShare 
      : expense.amount;
  };

  // Helper to get converted amount for display OR percentage calculation
  const getConvertedAmount = (expense: ExpenseType) => {
    const baseAmount = getBaseAmount(expense);
    
    if (!hasConversions) return baseAmount;
    
    const conversion = conversions?.get(expense.id);
    if (conversion?.converted) {
      // Scale by userShare ratio if applicable
      if (showUserShare && isUnifiedExpense(expense)) {
        const ratio = expense.userShare / expense.amount;
        return conversion.converted.amount * ratio;
      }
      return conversion.converted.amount;
    }
    
    // No conversion available for this expense (same currency as display)
    return baseAmount;
  };

  // Helper to get display amount (respects conversionMode for UI)
  const getDisplayAmount = (expense: ExpenseType) => {
    if (showConvertedAmounts) {
      return getConvertedAmount(expense);
    }
    return getBaseAmount(expense);
  };

  // Group expenses by currency when showing original currencies
  const expensesByCurrency = expenses.reduce((acc, expense) => {
    const curr = expense.currency;
    if (!acc[curr]) {
      acc[curr] = [];
    }
    acc[curr].push(expense);
    return acc;
  }, {} as Record<string, ExpenseType[]>);

  // Calculate totals per currency (for display)
  const totalsByCurrency = Object.entries(expensesByCurrency).map(([curr, exps]) => ({
    currency: curr,
    total: exps.reduce((sum, e) => sum + getBaseAmount(e), 0),
    count: exps.length,
  }));

  // Sort currencies: display currency first, then by total descending
  totalsByCurrency.sort((a, b) => {
    if (a.currency === effectiveDisplayCurrency) return -1;
    if (b.currency === effectiveDisplayCurrency) return 1;
    return b.total - a.total;
  });

  // ALWAYS calculate total in display currency for percentage calculation
  // This uses conversions (current or historical rates depending on user's mode)
  const totalInDisplayCurrency = hasConversions
    ? expenses.reduce((sum, e) => sum + getConvertedAmount(e), 0)
    : expenses.reduce((sum, e) => sum + getBaseAmount(e), 0);

  // When conversion is active for display, this is the same as totalInDisplayCurrency
  const convertedTotalForDisplay = showConvertedAmounts ? totalInDisplayCurrency : 0;

  // Calculate personal vs group breakdown
  const calculateBreakdown = () => {
    if (showConvertedAmounts) {
      const personalTotal = expenses.reduce((sum, e) => {
        const isPersonal = isUnifiedExpense(e) ? e.isPersonal : !e.groupId;
        return isPersonal ? sum + getDisplayAmount(e) : sum;
      }, 0);
      return {
        personal: { [effectiveDisplayCurrency]: personalTotal },
        group: { [effectiveDisplayCurrency]: convertedTotalForDisplay - personalTotal },
      };
    } else {
      // Group by currency when not converting for display
      const personal: Record<string, number> = {};
      const group: Record<string, number> = {};
      
      for (const expense of expenses) {
        const isPersonal = isUnifiedExpense(expense) ? expense.isPersonal : !expense.groupId;
        const amount = getBaseAmount(expense);
        const curr = expense.currency;
        
        if (isPersonal) {
          personal[curr] = (personal[curr] || 0) + amount;
        } else {
          group[curr] = (group[curr] || 0) + amount;
        }
      }
      
      return { personal, group };
    }
  };

  const breakdown = calculateBreakdown();

  // Calculate by category - GROUP BY CATEGORY ONLY, not by currency
  // For display: show amounts in original currencies when mode is 'off'
  // For percentages: always use converted amounts
  const byCategory = expenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId || 'other';
    const category = expense.category;
    const displayCurr = showConvertedAmounts ? effectiveDisplayCurrency : expense.currency;
    const displayAmount = showConvertedAmounts ? getConvertedAmount(expense) : getBaseAmount(expense);
    // Always get converted amount for percentage calculation
    const convertedAmount = getConvertedAmount(expense);
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category,
        amounts: {} as Record<string, number>, // For display
        convertedTotal: 0, // For percentage calculation
        count: 0,
      };
    }
    acc[categoryId].amounts[displayCurr] = (acc[categoryId].amounts[displayCurr] || 0) + displayAmount;
    acc[categoryId].convertedTotal += convertedAmount;
    acc[categoryId].count += 1;
    return acc;
  }, {} as Record<string, { 
    category: typeof expenses[0]['category']; 
    amounts: Record<string, number>; 
    convertedTotal: number;
    count: number 
  }>);

  // Sort categories by converted total (ensures consistent sorting across currencies)
  const sortedCategories = Object.values(byCategory).sort(
    (a, b) => b.convertedTotal - a.convertedTotal
  );

  // Calculate this month's totals
  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });

  const thisMonthTotals = showConvertedAmounts
    ? [{ currency: effectiveDisplayCurrency, total: thisMonth.reduce((sum, e) => sum + getDisplayAmount(e), 0) }]
    : Object.entries(
        thisMonth.reduce((acc, e) => {
          acc[e.currency] = (acc[e.currency] || 0) + getBaseAmount(e);
          return acc;
        }, {} as Record<string, number>)
      ).map(([currency, total]) => ({ currency, total }));

  // Count how many expenses were converted
  const convertedCount = hasConversions 
    ? expenses.filter(e => {
        const conversion = conversions?.get(e.id);
        return conversion?.converted && conversion.converted.currency !== e.currency;
      }).length
    : 0;

  // Format multiple currency amounts (for display currency first, then + others)
  const formatMultiCurrency = (amounts: Record<string, number>) => {
    const entries = Object.entries(amounts).filter(([, v]) => v > 0);
    if (entries.length === 0) return formatCurrency(0, effectiveDisplayCurrency);
    
    // Sort: display currency first, then others
    entries.sort(([a], [b]) => {
      if (a === effectiveDisplayCurrency) return -1;
      if (b === effectiveDisplayCurrency) return 1;
      return 0;
    });
    
    return entries.map(([curr, val]) => formatCurrency(val, curr)).join(' + ');
  };

  // Format amounts for category line - handles mixed currencies
  const formatCategoryAmounts = (amounts: Record<string, number>) => {
    const entries = Object.entries(amounts).filter(([, v]) => v > 0);
    if (entries.length === 0) return formatCurrency(0, effectiveDisplayCurrency);
    
    // Sort: display currency first
    entries.sort(([a], [b]) => {
      if (a === effectiveDisplayCurrency) return -1;
      if (b === effectiveDisplayCurrency) return 1;
      return 0;
    });
    
    if (entries.length === 1) {
      return formatCurrency(entries[0][1], entries[0][0]);
    }
    
    // Multiple currencies: show each
    return entries.map(([curr, val]) => formatCurrency(val, curr)).join(' + ');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {showUserShare ? t('summary.yourTotalSpending') : t('summary.totalSpending')}
          </CardTitle>
          {showConvertedAmounts && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-xs gap-1 font-normal"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    {conversionMode === 'smart' ? t('currency.historical') : t('currency.current')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div className="font-medium mb-1">
                      {t('currency.conversionActive')}
                    </div>
                    <div>
                      {t('currency.expensesConverted', { count: convertedCount, total: expenses.length })}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {conversionMode === 'smart' 
                        ? t('currency.usingHistoricalRates')
                        : t('currency.usingCurrentRates')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Total */}
        <div className="mb-1">
          {showConvertedAmounts ? (
            // Single converted total
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(convertedTotalForDisplay, effectiveDisplayCurrency)}
              </span>
              {isConverting && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {t('common.converting')}
                </span>
              )}
            </div>
          ) : (
            // Multiple currency totals - show as "X + Y" format
            <div className="text-2xl font-bold">
              {totalsByCurrency.map(({ currency: curr, total }, index) => (
                <span key={curr}>
                  {index > 0 && <span className="text-muted-foreground mx-2">+</span>}
                  <span className={curr !== effectiveDisplayCurrency ? "text-muted-foreground" : ""}>
                    {formatCurrency(total, curr)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* This month info */}
        <p className="text-xs text-muted-foreground mb-2">
          {expenses.length === 1 
            ? t('summary.expenseCount', { count: expenses.length })
            : t('summary.expenseCountPlural', { count: expenses.length })} •{' '}
          {thisMonthTotals.map(({ currency: curr, total }, i) => (
            <span key={curr}>
              {i > 0 && ' + '}
              {formatCurrency(total, curr)}
            </span>
          ))} {t('common.thisMonth')}
        </p>
        
        {/* Personal vs Group breakdown */}
        {showUserShare && (
          <div className="flex gap-4 text-xs mb-4 pb-3 border-b flex-wrap">
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {t('common.personal')}: {formatMultiCurrency(breakdown.personal)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t('common.group')}: {formatMultiCurrency(breakdown.group)}
            </span>
          </div>
        )}

        {/* Category Breakdown - shows all categories, combines currencies */}
        {/* Percentages are ALWAYS calculated using converted amounts (to display currency) */}
        <div className="space-y-2">
          {sortedCategories.map(({ category, amounts, convertedTotal }) => {
            const Icon = category ? getCategoryIcon(category.icon) : null;
            // Calculate percentage based on converted total (in display currency)
            const percentage = totalInDisplayCurrency > 0 
              ? ((convertedTotal / totalInDisplayCurrency) * 100).toFixed(0) 
              : '0';
            
            // Translate category name based on icon
            const getCategoryTranslation = (icon: string | undefined) => {
              const iconToKey: Record<string, string> = {
                'utensils': 'food',
                'car': 'transportation',
                'shopping-bag': 'shopping',
                'film': 'entertainment',
                'receipt': 'bills',
                'heart-pulse': 'health',
                'plane': 'travel',
                'shopping-cart': 'shopping',
                'home': 'other',
                'more-horizontal': 'other',
              };
              const key = icon ? iconToKey[icon] : 'other';
              return key ? t(`categories.${key}`) : category?.name || t('categories.other');
            };

            return (
              <div key={category?.id || 'other'} className="flex items-center gap-2">
                {Icon ? (
                  <Icon
                    size={16}
                    style={{ color: category?.color || '#6b7280' }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px]">•</span>
                  </div>
                )}
                <span className="text-sm truncate flex-1">
                  {getCategoryTranslation(category?.icon)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {percentage}%
                </span>
                <span className="text-sm font-medium text-end min-w-fit">
                  {formatCategoryAmounts(amounts)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
