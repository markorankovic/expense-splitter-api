import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalancesService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalances(userId: string, groupId: string) {
    await this.ensureMember(userId, groupId);

    // TODO: Maybe call this members?
    const memberIds = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const balances = new Map<string, number>();
    memberIds.forEach((member) => balances.set(member.userId, 0));

    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      select: {
        paidByUserId: true,
        splits: { select: { userId: true, amount: true } },
      },
    });

    for (const expense of expenses) {
      for (const split of expense.splits) {
        balances.set(
          split.userId,
          (balances.get(split.userId) ?? 0) - split.amount,
        );
        balances.set(
          expense.paidByUserId,
          (balances.get(expense.paidByUserId) ?? 0) + split.amount,
        );
      }
    }

    return {
      groupId,
      balances: memberIds.map((member) => ({
        userId: member.userId,
        balance: balances.get(member.userId) ?? 0,
      })),
    };
  }

  async getSettle(userId: string, groupId: string) {
    const { balances } = await this.getBalances(userId, groupId);

    const creditors = balances
      .filter((entry) => entry.balance > 0)
      .map((entry) => ({ ...entry }));
    const debtors = balances
      .filter((entry) => entry.balance < 0)
      .map((entry) => ({ ...entry }));

    const transfers: { fromUserId: string; toUserId: string; amount: number }[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(creditor.balance, -debtor.balance);
      if (amount > 0) {
        transfers.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount,
        });

        debtor.balance += amount;
        creditor.balance -= amount;
      }

      if (debtor.balance === 0) {
        i += 1;
      }

      if (creditor.balance === 0) {
        j += 1;
      }
    }

    return { groupId, transfers };
  }

  // TODO: This function is used in multiple places, maybe move it to a common service?
  private async ensureMember(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a group member');
    }
  }
}
