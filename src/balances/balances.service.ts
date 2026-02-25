import { Injectable } from '@nestjs/common';
import { GroupAccessService } from '../common/group-access.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupAccess: GroupAccessService,
  ) {}

  private async computeAllBalances(userId: string, groupId: string) {
    await this.groupAccess.ensureMember(userId, groupId);

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const balances = new Map<string, number>();
    members.forEach((member) => balances.set(member.userId, 0));

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

    return members.map((member) => ({
      userId: member.userId,
      balance: balances.get(member.userId) ?? 0,
    }));
  }

  async getBalances(
    userId: string,
    groupId: string,
    pagination?: { page?: number; pageSize?: number },
  ) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const balances = (await this.computeAllBalances(userId, groupId)).filter(
      (entry) => entry.balance !== 0,
    );

    return {
      groupId,
      balances: balances.slice(skip, skip + pageSize),
      page,
      pageSize,
      total: balances.length,
    };
  }

  async getSettle(
    userId: string,
    groupId: string,
    pagination?: { page?: number; pageSize?: number },
  ) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const balances = await this.computeAllBalances(userId, groupId);

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

    return {
      groupId,
      transfers: transfers.slice(skip, skip + pageSize),
      page,
      pageSize,
      total: transfers.length,
    };
  }
}
