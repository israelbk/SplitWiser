'use client';

/**
 * Balance display component
 * Shows balance amounts with appropriate styling
 */

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { DirectionalIcon } from './rtl-icon';

interface BalanceAmountProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showSign?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

/**
 * Display a balance amount with color coding
 * Positive = green (you're owed), Negative = red (you owe)
 */
export function BalanceAmount({
  amount,
  currency = 'ILS',
  size = 'md',
  showSign = true,
  className,
}: BalanceAmountProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  const colorClass = isPositive
    ? 'text-success'
    : isNegative
    ? 'text-destructive'
    : 'text-muted-foreground';

  const displayAmount = Math.abs(amount);
  const sign = showSign && isPositive ? '+' : showSign && isNegative ? '-' : '';

  return (
    <span className={cn(colorClass, sizeClasses[size], className)}>
      {sign}
      {formatCurrency(displayAmount, currency)}
    </span>
  );
}

interface DebtDisplayProps {
  fromUser: User;
  toUser: User;
  amount: number;
  currency?: string;
  className?: string;
}

/**
 * Display a debt between two users
 */
export function DebtDisplay({
  fromUser,
  toUser,
  amount,
  currency = 'ILS',
  className,
}: DebtDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <UserAvatar user={fromUser} size="sm" />
      <span className="text-sm text-muted-foreground truncate max-w-[80px]">
        {fromUser.name}
      </span>
      <DirectionalIcon icon="arrow-right" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <UserAvatar user={toUser} size="sm" />
      <span className="text-sm text-muted-foreground truncate max-w-[80px]">
        {toUser.name}
      </span>
      <span className="ms-auto font-medium text-sm">
        {formatCurrency(amount, currency)}
      </span>
    </div>
  );
}

interface UserBalanceRowProps {
  user: User;
  balance: number;
  currency?: string;
  className?: string;
}

/**
 * Display a user's balance in a group
 */
export function UserBalanceRow({
  user,
  balance,
  currency = 'ILS',
  className,
}: UserBalanceRowProps) {
  const statusText =
    balance > 0
      ? 'gets back'
      : balance < 0
      ? 'owes'
      : 'settled up';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <UserAvatar user={user} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground">{statusText}</p>
      </div>
      <BalanceAmount amount={balance} currency={currency} size="md" />
    </div>
  );
}

