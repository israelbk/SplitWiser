'use client';

/**
 * Group balances component
 * Shows balance summary and simplified debts for a group
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGroupBalances } from '@/hooks/queries';
import { UserBalanceRow, DebtDisplay, BalanceSummarySkeleton } from '@/components/common';
import { formatCurrency } from '@/lib/constants';
import { Scale, ArrowRightLeft } from 'lucide-react';

interface GroupBalancesProps {
  groupId: string;
  currency?: string;
}

export function GroupBalances({ groupId, currency = 'ILS' }: GroupBalancesProps) {
  const { data: balanceSummary, isLoading } = useGroupBalances(groupId);

  if (isLoading) {
    return <BalanceSummarySkeleton />;
  }

  if (!balanceSummary) {
    return null;
  }

  const { totalExpenses, userBalances, simplifiedDebts } = balanceSummary;

  return (
    <div className="space-y-4">
      {/* Total Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Group Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpenses, currency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Split among {userBalances.length} members
          </p>
        </CardContent>
      </Card>

      {/* User Balances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Member Balances
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
                  currency={currency}
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
              Settle Up
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
                    currency={currency}
                  />
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Settled */}
      {simplifiedDebts.length === 0 && totalExpenses > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <p className="text-green-700 font-medium">All settled up!</p>
            <p className="text-sm text-green-600">
              Everyone&apos;s expenses are balanced.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

