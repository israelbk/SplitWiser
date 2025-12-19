'use client';

/**
 * Split configuration component
 * Fully controlled component for configuring expense payments and splits
 * 
 * Architecture:
 * - Parent controls open state and passes current data when opening
 * - Component initializes internal state from props when opened
 * - On Save, calls onSave callback with configured data
 * - No refs, no race conditions, clean data flow
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { SplitType, PaymentEntry, SplitEntry, SplitConfiguration } from '@/lib/types/expense';
import { formatCurrency } from '@/lib/constants';
import { ChevronRight, Users, Wallet, Check, Equal, Percent, Hash, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitConfigProps {
  /** Whether the sheet is open (controlled) */
  open: boolean;
  /** Callback when sheet should open/close */
  onOpenChange: (open: boolean) => void;
  /** The expense amount - passed when opening */
  amount: number;
  /** Currency code */
  currency?: string;
  /** Current user's ID */
  currentUserId: string;
  /** Group members */
  members: User[];
  /** Initial configuration (for editing existing splits) */
  initialConfig?: SplitConfiguration;
  /** Callback when user saves valid configuration */
  onSave: (config: SplitConfiguration) => void;
}

type InternalSplitType = 'equal' | 'percentage' | 'shares' | 'exact';

interface InternalSplitEntry extends SplitEntry {
  selected: boolean;
}

interface InternalPaymentEntry extends PaymentEntry {
  selected: boolean;
}

export function SplitConfig({
  open,
  onOpenChange,
  amount,
  currency = 'ILS',
  currentUserId,
  members,
  initialConfig,
  onSave,
}: SplitConfigProps) {
  const [activeTab, setActiveTab] = useState<'payment' | 'split'>('split');
  
  // Payment state
  const [payments, setPayments] = useState<InternalPaymentEntry[]>([]);

  // Split state
  const [splitType, setSplitType] = useState<InternalSplitType>('equal');
  const [splits, setSplits] = useState<InternalSplitEntry[]>([]);
  
  // Track previous open state to detect open transition
  const wasOpenRef = useRef(false);
  
  // Initialize state only when sheet OPENS (not on every initialConfig change while open)
  useEffect(() => {
    const isOpening = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    
    if (isOpening && amount > 0) {
      const currentSplitType = (initialConfig?.splitType as InternalSplitType) || 'equal';
      setPayments(initializePayments(initialConfig, members, currentUserId, amount));
      setSplitType(currentSplitType);
      setSplits(initializeSplits(initialConfig, members, amount, currentSplitType));
      setActiveTab('split');
    }
  }, [open, amount, initialConfig, members, currentUserId]);

  // Handle payment toggle
  const togglePayment = (userId: string) => {
    setPayments(prev => {
      const updated = prev.map(p => 
        p.userId === userId ? { ...p, selected: !p.selected } : p
      );
      // Recalculate if single payer
      const selected = updated.filter(p => p.selected);
      if (selected.length === 1) {
        return updated.map(p => ({
          ...p,
          amount: p.selected ? amount : 0,
        }));
      }
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
      return recalculateSplitsForType(updated, splitType, amount);
    });
  };

  // Handle split type change
  const handleSplitTypeChange = (newType: InternalSplitType) => {
    setSplitType(newType);
    setSplits(prev => recalculateSplitsForType(prev, newType, amount));
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
    onSave(config);
    onOpenChange(false);
  };

  // Validation
  const paymentTotal = payments.filter(p => p.selected).reduce((sum, p) => sum + p.amount, 0);
  const splitTotal = splits.filter(s => s.selected).reduce((sum, s) => sum + s.amount, 0);
  const isPaymentValid = Math.abs(paymentTotal - amount) < 0.01;
  const isSplitValid = Math.abs(splitTotal - amount) < 0.01;
  const hasSelectedSplits = splits.some(s => s.selected);
  const hasSelectedPayments = payments.some(p => p.selected);
  const isValid = isPaymentValid && isSplitValid && hasSelectedSplits && hasSelectedPayments;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[70vh] md:h-[80vh] lg:h-[70vh] max-h-[700px] flex flex-col"
      >
        <SheetHeader className="text-left flex-shrink-0">
          <SheetTitle>Split Options</SheetTitle>
          <SheetDescription>
            Total: {formatCurrency(amount, currency)}
          </SheetDescription>
        </SheetHeader>

        {/* Main content area - scrollable */}
        <div className="flex-1 overflow-hidden mt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'payment' | 'split')} className="h-full flex flex-col">
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="payment" className="flex-1 gap-2">
                <Wallet className="h-4 w-4" />
                Paid by
              </TabsTrigger>
              <TabsTrigger value="split" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                Split
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="mt-4 flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
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

            <TabsContent value="split" className="mt-4 flex-1 overflow-hidden flex flex-col">
              {/* Split type selector - fixed */}
              <div className="mb-4 flex-shrink-0">
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

              {/* Members list - scrollable */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2">
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
        </div>

        {/* Footer - always visible at bottom */}
        <SheetFooter className="flex-shrink-0 pt-4 border-t mt-4 flex-col gap-2">
          {/* Validation messages */}
          {(!isPaymentValid || !isSplitValid) && (
            <div className="w-full text-sm text-center">
              {!isPaymentValid && hasSelectedPayments && (
                <p className="text-destructive">
                  Payment total ({formatCurrency(paymentTotal, currency)}) doesn't match expense ({formatCurrency(amount, currency)})
                </p>
              )}
              {!isSplitValid && hasSelectedSplits && (
                <p className="text-destructive">
                  Split total ({formatCurrency(splitTotal, currency)}) doesn't match expense ({formatCurrency(amount, currency)})
                </p>
              )}
            </div>
          )}
          <Button onClick={handleSave} disabled={!isValid} className="w-full">
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Trigger Button Component - Displays current split summary
// ============================================================================

interface SplitConfigTriggerProps {
  onClick: () => void;
  config?: SplitConfiguration;
  amount: number;
  currency?: string;
  currentUserId: string;
  members: User[];
  disabled?: boolean;
}

export function SplitConfigTrigger({
  onClick,
  config,
  amount,
  currency = 'ILS',
  currentUserId,
  members,
  disabled = false,
}: SplitConfigTriggerProps) {
  // Calculate summary text from saved config
  const summaryText = useMemo(() => {
    const sourcePayments = config?.payments || [];
    const sourceSplits = config?.splits || [];
    const sourceSplitType = config?.splitType || 'equal';

    // Payment summary
    let paymentText = '';
    if (sourcePayments.length === 1 && sourcePayments[0].userId === currentUserId) {
      paymentText = 'Paid by you';
    } else if (sourcePayments.length === 1) {
      const payer = members.find(m => m.id === sourcePayments[0].userId);
      paymentText = `Paid by ${payer?.name || 'someone'}`;
    } else if (sourcePayments.length > 1) {
      paymentText = `Paid by ${sourcePayments.length} people`;
    } else {
      paymentText = 'Paid by you';
    }

    // Split summary
    let splitText = '';
    if (sourceSplits.length === 0) {
      splitText = 'split equally';
    } else if (sourceSplits.length === members.length && sourceSplitType === 'equal') {
      splitText = 'split equally';
    } else if (sourceSplits.length === members.length) {
      splitText = `split ${sourceSplitType === 'percentage' ? 'by %' : sourceSplitType === 'shares' ? 'by shares' : 'by amount'}`;
    } else {
      splitText = `split among ${sourceSplits.length}`;
    }

    return `${paymentText}, ${splitText}`;
  }, [config, members, currentUserId]);

  // Get user's share from saved config
  const userShare = useMemo(() => {
    const userSplit = config?.splits?.find(s => s.userId === currentUserId);
    return userSplit?.amount || 0;
  }, [config, currentUserId]);

  // Get payers for avatar display
  const payers = useMemo(() => {
    if (!config?.payments?.length) {
      // Default: current user
      return [members.find(m => m.id === currentUserId)].filter(Boolean) as User[];
    }
    return config.payments
      .map(p => members.find(m => m.id === p.userId))
      .filter(Boolean) as User[];
  }, [config, members, currentUserId]);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-between h-auto py-3 px-4",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3 text-left">
        <div className="flex -space-x-2">
          {payers.slice(0, 2).map((user) => (
            <UserAvatar key={user.id} user={user} size="sm" className="ring-2 ring-background" />
          ))}
        </div>
        <div>
          <p className="text-sm font-medium">
            {disabled ? 'Enter amount first' : summaryText}
          </p>
          {!disabled && userShare > 0 && amount > 0 && (
            <p className="text-xs text-muted-foreground">
              Your share: {formatCurrency(userShare, currency)}
            </p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function initializePayments(
  config: SplitConfiguration | undefined,
  members: User[],
  currentUserId: string,
  amount: number
): InternalPaymentEntry[] {
  if (config?.payments && config.payments.length > 0) {
    // Single payer case - always use the current total amount
    if (config.payments.length === 1) {
      const payerId = config.payments[0].userId;
      return members.map(m => ({
        userId: m.id,
        amount: m.id === payerId ? amount : 0,
        selected: m.id === payerId,
      }));
    }
    
    // Multiple payers - calculate proportionally if total doesn't match
    const savedTotal = config.payments.reduce((sum, p) => sum + p.amount, 0);
    const needsAdjustment = Math.abs(savedTotal - amount) > 0.01 && savedTotal > 0;
    
    return members.map(m => {
      const existing = config.payments.find(p => p.userId === m.id);
      if (!existing) {
        return { userId: m.id, amount: 0, selected: false };
      }
      // If amounts don't match, scale proportionally
      const adjustedAmount = needsAdjustment 
        ? (existing.amount / savedTotal) * amount 
        : existing.amount;
      return {
        userId: m.id,
        amount: adjustedAmount,
        selected: true,
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
  config: SplitConfiguration | undefined,
  members: User[],
  amount: number,
  splitType: InternalSplitType
): InternalSplitEntry[] {
  if (config?.splits && config.splits.length > 0) {
    // For equal splits, recalculate based on current amount
    if (config.splitType === 'equal') {
      const selectedUserIds = new Set(config.splits.map(s => s.userId));
      const selectedCount = selectedUserIds.size || members.length;
      const perPerson = amount / selectedCount;
      return members.map(m => ({
        userId: m.id,
        amount: selectedUserIds.has(m.id) ? perPerson : 0,
        percentage: selectedUserIds.has(m.id) ? 100 / selectedCount : 0,
        shares: 1,
        selected: selectedUserIds.has(m.id),
      }));
    }
    
    // For non-equal splits, restore saved values
    return members.map(m => {
      const existing = config.splits.find(s => s.userId === m.id);
      return {
        userId: m.id,
        amount: existing?.amount || 0,
        percentage: existing?.percentage || 0,
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

function recalculateSplitsForType(
  splits: InternalSplitEntry[],
  splitType: InternalSplitType,
  amount: number
): InternalSplitEntry[] {
  const selected = splits.filter(s => s.selected);
  if (selected.length === 0) return splits;

  if (splitType === 'equal') {
    const perPerson = amount / selected.length;
    return splits.map(s => ({
      ...s,
      amount: s.selected ? perPerson : 0,
      percentage: s.selected ? 100 / selected.length : 0,
    }));
  } else if (splitType === 'percentage') {
    const totalPercentage = selected.reduce((sum, s) => sum + (s.percentage || 0), 0);
    if (totalPercentage > 0) {
      return splits.map(s => ({
        ...s,
        amount: s.selected ? (amount * (s.percentage || 0)) / 100 : 0,
      }));
    }
  } else if (splitType === 'shares') {
    const totalShares = selected.reduce((sum, s) => sum + (s.shares || 0), 0);
    if (totalShares > 0) {
      return splits.map(s => ({
        ...s,
        amount: s.selected ? (amount * (s.shares || 0)) / totalShares : 0,
      }));
    }
  }
  
  return splits;
}
