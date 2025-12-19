'use client';

/**
 * Split configuration component
 * Allows configuring who paid and how the expense is split
 */

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { SplitType, PaymentEntry, SplitEntry, SplitConfiguration } from '@/lib/types/expense';
import { formatCurrency } from '@/lib/constants';
import { ChevronRight, Users, Wallet, Check, Equal, Percent, Hash, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitConfigProps {
  amount: number;
  currency?: string;
  currentUserId: string;
  members: User[];
  value?: SplitConfiguration;
  onChange: (config: SplitConfiguration) => void;
}

type InternalSplitType = 'equal' | 'percentage' | 'shares' | 'exact';

interface InternalSplitEntry extends SplitEntry {
  selected: boolean;
}

interface InternalPaymentEntry extends PaymentEntry {
  selected: boolean;
}

export function SplitConfig({
  amount,
  currency = 'ILS',
  currentUserId,
  members,
  value,
  onChange,
}: SplitConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'split'>('split');

  // Payment state
  const [payments, setPayments] = useState<InternalPaymentEntry[]>(() => 
    initializePayments(value, members, currentUserId, amount)
  );

  // Split state
  const [splitType, setSplitType] = useState<InternalSplitType>(
    (value?.splitType as InternalSplitType) || 'equal'
  );
  const [splits, setSplits] = useState<InternalSplitEntry[]>(() =>
    initializeSplits(value, members, amount)
  );

  // Reinitialize when sheet opens
  useEffect(() => {
    if (isOpen) {
      // Always reinitialize with fresh data when sheet opens
      const effectiveAmount = amount || 0;
      const perPerson = effectiveAmount / Math.max(members.length, 1);
      setPayments(members.map(m => ({
        userId: m.id,
        amount: m.id === currentUserId ? effectiveAmount : 0,
        selected: m.id === currentUserId,
      })));
      setSplits(members.map(m => ({
        userId: m.id,
        amount: perPerson,
        percentage: 100 / Math.max(members.length, 1),
        shares: 1,
        selected: true,
      })));
    }
  }, [isOpen, members, currentUserId]);

  // Recalculate when amount changes (any time, not just when > 0)
  useEffect(() => {
    if (isOpen) {
      recalculateSplits(splits, splitType, amount, setSplits);
      recalculatePayments(payments, amount, setPayments);
    }
  }, [amount, isOpen]);

  // Get current user
  const currentUser = members.find(m => m.id === currentUserId);

  // Calculate summary text
  const summaryText = useMemo(() => {
    const selectedPayments = payments.filter(p => p.selected);
    const selectedSplits = splits.filter(s => s.selected);

    // Payment summary
    let paymentText = '';
    if (selectedPayments.length === 1 && selectedPayments[0].userId === currentUserId) {
      paymentText = 'Paid by you';
    } else if (selectedPayments.length === 1) {
      const payer = members.find(m => m.id === selectedPayments[0].userId);
      paymentText = `Paid by ${payer?.name || 'someone'}`;
    } else {
      paymentText = `Paid by ${selectedPayments.length} people`;
    }

    // Split summary
    let splitText = '';
    if (selectedSplits.length === members.length && splitType === 'equal') {
      splitText = 'split equally';
    } else if (selectedSplits.length === members.length) {
      splitText = `split ${splitType === 'percentage' ? 'by %' : splitType === 'shares' ? 'by shares' : 'by amount'}`;
    } else {
      splitText = `split among ${selectedSplits.length}`;
    }

    return `${paymentText}, ${splitText}`;
  }, [payments, splits, splitType, members, currentUserId]);

  // Get user's share
  const userShare = useMemo(() => {
    const userSplit = splits.find(s => s.userId === currentUserId && s.selected);
    return userSplit?.amount || 0;
  }, [splits, currentUserId]);

  // Handle payment toggle
  const togglePayment = (userId: string) => {
    setPayments(prev => {
      const updated = prev.map(p => 
        p.userId === userId ? { ...p, selected: !p.selected } : p
      );
      recalculatePayments(updated, amount, setPayments);
      return updated;
    });
  };

  // Handle payment amount change
  const updatePaymentAmount = (userId: string, newAmount: number) => {
    setPayments(prev => 
      prev.map(p => p.userId === userId ? { ...p, amount: newAmount } : p)
    );
  };

  // Handle split toggle
  const toggleSplit = (userId: string) => {
    setSplits(prev => {
      const updated = prev.map(s => 
        s.userId === userId ? { ...s, selected: !s.selected } : s
      );
      recalculateSplits(updated, splitType, amount, setSplits);
      return updated;
    });
  };

  // Handle split type change
  const handleSplitTypeChange = (newType: InternalSplitType) => {
    setSplitType(newType);
    recalculateSplits(splits, newType, amount, setSplits);
  };

  // Handle split value change (percentage, shares, or exact amount)
  const updateSplitValue = (userId: string, field: 'percentage' | 'shares' | 'amount', value: number) => {
    setSplits(prev => {
      const updated = prev.map(s => {
        if (s.userId !== userId) return s;
        if (field === 'percentage') return { ...s, percentage: value };
        if (field === 'shares') return { ...s, shares: value };
        return { ...s, amount: value };
      });
      
      // Recalculate amounts based on split type
      if (splitType === 'percentage') {
        const totalPercentage = updated.filter(s => s.selected).reduce((sum, s) => sum + (s.percentage || 0), 0);
        if (totalPercentage > 0) {
          return updated.map(s => ({
            ...s,
            amount: s.selected ? (amount * (s.percentage || 0)) / 100 : 0
          }));
        }
      } else if (splitType === 'shares') {
        const totalShares = updated.filter(s => s.selected).reduce((sum, s) => sum + (s.shares || 0), 0);
        if (totalShares > 0) {
          return updated.map(s => ({
            ...s,
            amount: s.selected ? (amount * (s.shares || 0)) / totalShares : 0
          }));
        }
      }
      
      return updated;
    });
  };

  // Save configuration
  const handleSave = () => {
    const config: SplitConfiguration = {
      payments: payments.filter(p => p.selected).map(({ userId, amount }) => ({ userId, amount })),
      splitType,
      splits: splits.filter(s => s.selected).map(({ userId, amount, percentage, shares }) => ({
        userId,
        amount,
        ...(splitType === 'percentage' && { percentage }),
        ...(splitType === 'shares' && { shares }),
      })),
    };
    onChange(config);
    setIsOpen(false);
  };

  // Validation
  const paymentTotal = payments.filter(p => p.selected).reduce((sum, p) => sum + p.amount, 0);
  const splitTotal = splits.filter(s => s.selected).reduce((sum, s) => sum + s.amount, 0);
  const isPaymentValid = Math.abs(paymentTotal - amount) < 0.01;
  const isSplitValid = Math.abs(splitTotal - amount) < 0.01;
  const hasSelectedSplits = splits.some(s => s.selected);
  const hasSelectedPayments = payments.some(p => p.selected);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-auto py-3 px-4"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="flex -space-x-2">
              {payments.filter(p => p.selected).slice(0, 2).map((p) => {
                const user = members.find(m => m.id === p.userId);
                return user ? (
                  <UserAvatar key={p.userId} user={user} size="sm" className="ring-2 ring-background" />
                ) : null;
              })}
            </div>
            <div>
              <p className="text-sm font-medium">{summaryText}</p>
              {userShare > 0 && (
                <p className="text-xs text-muted-foreground">
                  Your share: {formatCurrency(userShare, currency)}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] sm:h-[70vh]">
        <SheetHeader className="text-left">
          <SheetTitle>Split Options</SheetTitle>
          <SheetDescription>
            {amount > 0 
              ? `Total: ${formatCurrency(amount, currency)}`
              : 'Enter an amount to configure the split'
            }
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'payment' | 'split')} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="payment" className="flex-1 gap-2">
              <Wallet className="h-4 w-4" />
              Paid by
            </TabsTrigger>
            <TabsTrigger value="split" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Split
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="mt-4">
            <ScrollArea className="h-[40vh]">
              <div className="space-y-2 pr-4">
                {members.map((member) => {
                  const payment = payments.find(p => p.userId === member.id);
                  const isSelected = payment?.selected || false;
                  const isOnlyPayer = payments.filter(p => p.selected).length === 1 && isSelected;

                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePayment(member.id)}
                      />
                      <UserAvatar user={member} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.id === currentUserId ? 'You' : member.name}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">₪</span>
                          <Input
                            type="number"
                            value={payment?.amount || 0}
                            onChange={(e) => updatePaymentAmount(member.id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                            disabled={isOnlyPayer}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Payment validation */}
              <div className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                isPaymentValid ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"
              )}>
                {isPaymentValid ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Payment adds up to total
                  </div>
                ) : (
                  <p>
                    Payment total: {formatCurrency(paymentTotal, currency)} 
                    (need {formatCurrency(amount - paymentTotal, currency)} more)
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="split" className="mt-4">
            {/* Split type selector */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Split method</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'equal', label: 'Equal', icon: Equal },
                  { value: 'exact', label: 'Amount', icon: DollarSign },
                  { value: 'percentage', label: 'Percent', icon: Percent },
                  { value: 'shares', label: 'Shares', icon: Hash },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={splitType === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSplitTypeChange(value as InternalSplitType)}
                    className="flex-col h-auto py-2 gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="h-[32vh]">
              <div className="space-y-2 pr-4">
                {members.map((member) => {
                  const split = splits.find(s => s.userId === member.id);
                  const isSelected = split?.selected || false;

                  return (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSplit(member.id)}
                      />
                      <UserAvatar user={member} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.id === currentUserId ? 'You' : member.name}
                        </p>
                        {isSelected && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(split?.amount || 0, currency)}
                          </p>
                        )}
                      </div>
                      {isSelected && splitType !== 'equal' && (
                        <div className="flex items-center gap-2">
                          {splitType === 'percentage' && (
                            <>
                              <Input
                                type="number"
                                value={split?.percentage || 0}
                                onChange={(e) => updateSplitValue(member.id, 'percentage', parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 text-right"
                                min={0}
                                max={100}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </>
                          )}
                          {splitType === 'shares' && (
                            <>
                              <Input
                                type="number"
                                value={split?.shares || 1}
                                onChange={(e) => updateSplitValue(member.id, 'shares', parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-right"
                                min={1}
                              />
                              <span className="text-sm text-muted-foreground">shares</span>
                            </>
                          )}
                          {splitType === 'exact' && (
                            <>
                              <span className="text-sm text-muted-foreground">₪</span>
                              <Input
                                type="number"
                                value={split?.amount || 0}
                                onChange={(e) => updateSplitValue(member.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 text-right"
                                min={0}
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Split validation */}
              <div className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                isSplitValid ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"
              )}>
                {isSplitValid ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Split adds up to total
                  </div>
                ) : (
                  <p>
                    Split total: {formatCurrency(splitTotal, currency)}
                    {splitTotal < amount && ` (need ${formatCurrency(amount - splitTotal, currency)} more)`}
                    {splitTotal > amount && ` (${formatCurrency(splitTotal - amount, currency)} over)`}
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4">
          <Button
            onClick={handleSave}
            disabled={!isPaymentValid || !isSplitValid || !hasSelectedSplits || !hasSelectedPayments}
            className="w-full"
          >
            Confirm Split
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper functions

function initializePayments(
  value: SplitConfiguration | undefined,
  members: User[],
  currentUserId: string,
  amount: number
): InternalPaymentEntry[] {
  if (value?.payments && value.payments.length > 0) {
    return members.map(m => {
      const existing = value.payments.find(p => p.userId === m.id);
      return {
        userId: m.id,
        amount: existing?.amount || 0,
        selected: !!existing,
      };
    });
  }
  
  // Default: current user paid everything
  return members.map(m => ({
    userId: m.id,
    amount: m.id === currentUserId ? amount : 0,
    selected: m.id === currentUserId,
  }));
}

function initializeSplits(
  value: SplitConfiguration | undefined,
  members: User[],
  amount: number
): InternalSplitEntry[] {
  if (value?.splits && value.splits.length > 0) {
    return members.map(m => {
      const existing = value.splits.find(s => s.userId === m.id);
      return {
        userId: m.id,
        amount: existing?.amount || 0,
        percentage: existing?.percentage,
        shares: existing?.shares || 1,
        selected: !!existing,
      };
    });
  }
  
  // Default: split equally among all members
  const perPerson = amount / members.length;
  return members.map(m => ({
    userId: m.id,
    amount: perPerson,
    percentage: 100 / members.length,
    shares: 1,
    selected: true,
  }));
}

function recalculateSplits(
  splits: InternalSplitEntry[],
  splitType: InternalSplitType,
  amount: number,
  setSplits: React.Dispatch<React.SetStateAction<InternalSplitEntry[]>>
) {
  const selected = splits.filter(s => s.selected);
  if (selected.length === 0) return;

  setSplits(prev => {
    if (splitType === 'equal') {
      const perPerson = amount / selected.length;
      return prev.map(s => ({
        ...s,
        amount: s.selected ? perPerson : 0,
        percentage: s.selected ? 100 / selected.length : 0,
      }));
    } else if (splitType === 'percentage') {
      const totalPercentage = prev.filter(s => s.selected).reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (totalPercentage > 0) {
        return prev.map(s => ({
          ...s,
          amount: s.selected ? (amount * (s.percentage || 0)) / 100 : 0,
        }));
      }
    } else if (splitType === 'shares') {
      const totalShares = prev.filter(s => s.selected).reduce((sum, s) => sum + (s.shares || 0), 0);
      if (totalShares > 0) {
        return prev.map(s => ({
          ...s,
          amount: s.selected ? (amount * (s.shares || 0)) / totalShares : 0,
        }));
      }
    }
    return prev;
  });
}

function recalculatePayments(
  payments: InternalPaymentEntry[],
  amount: number,
  setPayments: React.Dispatch<React.SetStateAction<InternalPaymentEntry[]>>
) {
  const selected = payments.filter(p => p.selected);
  if (selected.length === 1) {
    // Single payer gets full amount
    setPayments(prev => prev.map(p => ({
      ...p,
      amount: p.selected ? amount : 0,
    })));
  }
}

