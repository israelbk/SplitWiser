/**
 * Balance service
 * Calculates balances and simplified debts for groups
 */

import { expenseRepository } from '../repositories';
import { groupService } from './group.service';
import { userService } from './user.service';
import { 
  UserBalance, 
  Debt, 
  GroupBalanceSummary,
  User,
} from '../types';

export class BalanceService {
  /**
   * Calculate balances for all members of a group
   */
  async calculateGroupBalances(groupId: string): Promise<GroupBalanceSummary> {
    // Get group members
    const members = await groupService.getGroupMembers(groupId);
    const memberIds = members.map((m) => m.userId);
    const users = await userService.getUsersByIds(memberIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get all contributions and splits for this group
    const contributions = await expenseRepository.getGroupContributions(groupId);
    const splits = await expenseRepository.getGroupSplits(groupId);

    // Calculate per-user balances
    const balanceMap = new Map<string, { paid: number; owes: number }>();

    // Initialize all members with zero balances
    memberIds.forEach((id) => {
      balanceMap.set(id, { paid: 0, owes: 0 });
    });

    // Sum up contributions (what each user paid)
    contributions.forEach((contribution) => {
      const balance = balanceMap.get(contribution.userId);
      if (balance) {
        balance.paid += contribution.amount;
      }
    });

    // Sum up splits (what each user owes)
    splits.forEach((split) => {
      if (!split.isSettled) {
        const balance = balanceMap.get(split.userId);
        if (balance) {
          balance.owes += split.amount;
        }
      }
    });

    // Build user balances
    const userBalances: UserBalance[] = Array.from(balanceMap.entries()).map(
      ([userId, { paid, owes }]) => ({
        userId,
        user: userMap.get(userId),
        totalPaid: paid,
        totalOwes: owes,
        netBalance: paid - owes, // Positive = owed money, Negative = owes money
      })
    );

    // Calculate total expenses
    const totalExpenses = splits.reduce((sum, s) => sum + s.amount, 0);

    // Calculate simplified debts
    const simplifiedDebts = this.simplifyDebts(userBalances, userMap);

    return {
      groupId,
      totalExpenses,
      userBalances,
      simplifiedDebts,
    };
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
    userId2: string
  ): Promise<number> {
    const summary = await this.calculateGroupBalances(groupId);
    
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

