'use client';

/**
 * Group balances component
 * Shows balance summary and simplified debts for a group
 * Supports currency conversion display
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroupBalances } from '@/hooks/queries';
import { UserBalanceRow, DebtDisplay, BalanceSummarySkeleton } from '@/components/common';
import { formatCurrency } from '@/lib/constants';
import { Scale, ArrowRightLeft, Clock, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

interface GroupBalancesProps {
  groupId: string;
  currency?: string;
}

export function GroupBalances({ groupId, currency = 'ILS' }: GroupBalancesProps) {
  const { data: balanceSummary, isLoading } = useGroupBalances(groupId);
  const t = useTranslations('balances');
  const tCurrency = useTranslations('currency');

  if (isLoading) {
    return <BalanceSummarySkeleton />;
  }

  if (!balanceSummary) {
    return null;
  }

  const { 
    totalExpenses, 
    userBalances, 
    simplifiedDebts,
    displayCurrency,
    conversionMode,
  } = balanceSummary;

  // Use display currency from balance summary if available, otherwise fall back to prop
  const effectiveCurrency = displayCurrency || currency;
  const isConverting = conversionMode && conversionMode !== 'off';

  return (
    <div className="space-y-4">
      {/* Total Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {t('groupTotal')}
            </CardTitle>
            {isConverting && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs gap-1 font-normal">
                      {conversionMode === 'smart' ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {conversionMode === 'smart' ? tCurrency('historical') : tCurrency('current')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {conversionMode === 'smart' 
                        ? tCurrency('usingHistoricalRates')
                        : tCurrency('usingCurrentRates')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpenses, effectiveCurrency)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('splitAmong', { count: userBalances.length })}
            {isConverting && ` • ${t('convertedTo', { currency: effectiveCurrency })}`}
          </p>
        </CardContent>
      </Card>

      {/* User Balances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('memberBalances')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userBalances.map((balance) =>
              balance.user ? (
                <UserBalanceRow
                  key={balance.userId}
                  user={balance.user}
                  balance={balance.netBalance}
                  currency={effectiveCurrency}
                />
              ) : null
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simplified Debts */}
      {simplifiedDebts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              {t('settleUp')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {simplifiedDebts.map((debt, index) =>
                debt.fromUser && debt.toUser ? (
                  <DebtDisplay
                    key={index}
                    fromUser={debt.fromUser}
                    toUser={debt.toUser}
                    amount={debt.amount}
                    currency={effectiveCurrency}
                  />
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Settled */}
      {simplifiedDebts.length === 0 && totalExpenses > 0 && (
        <Card className="bg-success/10 border-success/30">
          <CardContent className="pt-6 text-center">
            <p className="text-success font-medium">{t('allSettled')}</p>
            <p className="text-sm text-success/80">
              {t('allSettledDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
