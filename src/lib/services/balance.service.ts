/**
 * Balance service
 * Calculates balances and simplified debts for groups
 * Supports currency conversion for multi-currency groups
 */

import { expenseRepository } from '../repositories';
import { groupService } from './group.service';
import { userService } from './user.service';
import { currencyService } from './currency.service';
import { 
  UserBalance, 
  Debt, 
  GroupBalanceSummary,
  User,
  ConversionMode,
  ExpenseContribution,
  ExpenseSplit,
  Expense,
} from '../types';
import { format } from 'date-fns';

interface BalanceCalculationOptions {
  displayCurrency?: string;
  conversionMode?: ConversionMode;
}

export class BalanceService {
  /**
   * Calculate balances for all members of a group
   * Optionally converts all amounts to a single display currency
   */
  async calculateGroupBalances(
    groupId: string,
    options?: BalanceCalculationOptions
  ): Promise<GroupBalanceSummary> {
    const { displayCurrency, conversionMode = 'off' } = options || {};

    // Get group members
    const members = await groupService.getGroupMembers(groupId);
    const memberIds = members.map((m) => m.userId);
    const users = await userService.getUsersByIds(memberIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get all expenses, contributions and splits for this group
    const expenses = await expenseRepository.findByGroupId(groupId);
    const contributions = await expenseRepository.getGroupContributions(groupId);
    const splits = await expenseRepository.getGroupSplits(groupId);

    // Create expense lookup for currency info
    const expenseMap = new Map(expenses.map(e => [e.id, e]));

    // Prepare conversion rates if needed
    let conversionRates: Map<string, number> = new Map();
    if (displayCurrency && conversionMode !== 'off') {
      conversionRates = await this.prepareConversionRates(
        expenses,
        displayCurrency,
        conversionMode
      );
    }

    // Calculate per-user balances
    const balanceMap = new Map<string, { paid: number; owes: number }>();

    // Initialize all members with zero balances
    memberIds.forEach((id) => {
      balanceMap.set(id, { paid: 0, owes: 0 });
    });

    // Sum up contributions (what each user paid)
    for (const contribution of contributions) {
      const balance = balanceMap.get(contribution.userId);
      if (balance) {
        const amount = await this.getConvertedAmount(
          contribution.amount,
          expenseMap.get(contribution.expenseId),
          displayCurrency,
          conversionMode,
          conversionRates
        );
        balance.paid += amount;
      }
    }

    // Sum up splits (what each user owes)
    for (const split of splits) {
      if (!split.isSettled) {
        const balance = balanceMap.get(split.userId);
        if (balance) {
          const amount = await this.getConvertedAmount(
            split.amount,
            expenseMap.get(split.expenseId),
            displayCurrency,
            conversionMode,
            conversionRates
          );
          balance.owes += amount;
        }
      }
    }

    // Build user balances
    const userBalances: UserBalance[] = Array.from(balanceMap.entries()).map(
      ([userId, { paid, owes }]) => ({
        userId,
        user: userMap.get(userId),
        totalPaid: Math.round(paid * 100) / 100,
        totalOwes: Math.round(owes * 100) / 100,
        netBalance: Math.round((paid - owes) * 100) / 100, // Positive = owed money, Negative = owes money
      })
    );

    // Calculate total expenses
    let totalExpenses = 0;
    for (const split of splits) {
      const amount = await this.getConvertedAmount(
        split.amount,
        expenseMap.get(split.expenseId),
        displayCurrency,
        conversionMode,
        conversionRates
      );
      totalExpenses += amount;
    }
    totalExpenses = Math.round(totalExpenses * 100) / 100;

    // Calculate simplified debts
    const simplifiedDebts = this.simplifyDebts(userBalances, userMap);

    return {
      groupId,
      totalExpenses,
      userBalances,
      simplifiedDebts,
      // Include conversion info if active
      ...(displayCurrency && conversionMode !== 'off' && {
        displayCurrency,
        conversionMode,
      }),
    };
  }

  /**
   * Prepare conversion rates for all unique currency/date combinations
   */
  private async prepareConversionRates(
    expenses: Expense[],
    targetCurrency: string,
    mode: ConversionMode
  ): Promise<Map<string, number>> {
    const rates = new Map<string, number>();

    // Get unique currencies
    const currencies = [...new Set(expenses.map(e => e.currency))];

    for (const fromCurrency of currencies) {
      if (fromCurrency === targetCurrency) {
        continue;
      }

      if (mode === 'simple') {
        // Fetch current rate once per currency
        const rate = await currencyService.fetchCurrentRate(fromCurrency, targetCurrency);
        rates.set(`${fromCurrency}-current`, rate);
      } else {
        // Smart mode: need rates for each unique date
        const datesForCurrency = [...new Set(
          expenses
            .filter(e => e.currency === fromCurrency)
            .map(e => format(e.date, 'yyyy-MM-dd'))
        )];

        for (const dateStr of datesForCurrency) {
          const rate = await currencyService.fetchHistoricalRate(
            fromCurrency,
            targetCurrency,
            new Date(dateStr)
          );
          rates.set(`${fromCurrency}-${dateStr}`, rate);
        }
      }
    }

    return rates;
  }

  /**
   * Get amount converted to display currency if needed
   */
  private async getConvertedAmount(
    amount: number,
    expense: Expense | undefined,
    displayCurrency: string | undefined,
    mode: ConversionMode,
    ratesCache: Map<string, number>
  ): Promise<number> {
    if (!displayCurrency || mode === 'off' || !expense) {
      return amount;
    }

    if (expense.currency === displayCurrency) {
      return amount;
    }

    let rate: number | undefined;

    if (mode === 'simple') {
      rate = ratesCache.get(`${expense.currency}-current`);
    } else {
      const dateStr = format(expense.date, 'yyyy-MM-dd');
      rate = ratesCache.get(`${expense.currency}-${dateStr}`);
    }

    if (rate) {
      return amount * rate;
    }

    // Fallback: fetch rate directly
    if (mode === 'simple') {
      rate = await currencyService.fetchCurrentRate(expense.currency, displayCurrency);
    } else {
      rate = await currencyService.fetchHistoricalRate(expense.currency, displayCurrency, expense.date);
    }

    return amount * rate;
  }

  /**
   * Simplify debts to minimize number of transactions
   * Uses a greedy algorithm to match creditors with debtors
   */
  private simplifyDebts(
    balances: UserBalance[],
    userMap: Map<string, User>
  ): Debt[] {
    // Separate into creditors (positive balance) and debtors (negative balance)
    const creditors: { userId: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];

    balances.forEach((balance) => {
      if (balance.netBalance > 0.01) {
        // Small threshold for floating point
        creditors.push({ userId: balance.userId, amount: balance.netBalance });
      } else if (balance.netBalance < -0.01) {
        debtors.push({ userId: balance.userId, amount: -balance.netBalance });
      }
    });

    // Sort by amount (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const debts: Debt[] = [];

    // Match debtors to creditors
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        debts.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          fromUser: userMap.get(debtor.userId),
          toUser: userMap.get(creditor.userId),
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return debts;
  }

  /**
   * Get balance between two specific users in a group
   */
  async getBalanceBetweenUsers(
    groupId: string,
    userId1: string,
    userId2: string,
    options?: BalanceCalculationOptions
  ): Promise<number> {
    const summary = await this.calculateGroupBalances(groupId, options);
    
    const debt = summary.simplifiedDebts.find(
      (d) =>
        (d.fromUserId === userId1 && d.toUserId === userId2) ||
        (d.fromUserId === userId2 && d.toUserId === userId1)
    );

    if (!debt) return 0;

    // Return positive if userId1 is owed, negative if userId1 owes
    return debt.fromUserId === userId1 ? -debt.amount : debt.amount;
  }
}

// Singleton instance
export const balanceService = new BalanceService();
