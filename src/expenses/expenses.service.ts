import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GroupAccessService } from '../common/group-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupAccess: GroupAccessService,
  ) {}

  async createExpense(userId: string, groupId: string, dto: CreateExpenseDto) {
    await this.groupAccess.ensureMember(userId, groupId);

    const splitTotal = dto.splits.reduce((sum, split) => sum + split.amount, 0);
    if (splitTotal !== dto.amount) {
      throw new BadRequestException('Splits must sum to amount');
    }

    const splitIds = dto.splits.map((split) => split.userId);
    const uniqueSplitIds = new Set(splitIds);
    if (uniqueSplitIds.size !== splitIds.length) {
      throw new BadRequestException('Duplicate split user');
    }

    const requiredUserIds = new Set([dto.paidByUserId, ...splitIds]);
    await this.ensureUsersInGroup(groupId, Array.from(requiredUserIds));

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          description: dto.description,
          amount: dto.amount,
          paidByUserId: dto.paidByUserId,
        },
        select: {
          id: true,
          groupId: true,
          description: true,
          amount: true,
          paidByUserId: true,
          createdAt: true,
        },
      });

      await tx.expenseSplit.createMany({
        data: dto.splits.map((split) => ({
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount,
        })),
      });

      return expense;
    });
  }

  async listExpenses(
    userId: string,
    groupId: string,
    pagination?: { page?: number; pageSize?: number },
  ) {
    await this.groupAccess.ensureMember(userId, groupId);

    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = { groupId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          description: true,
          amount: true,
          paidByUserId: true,
          createdAt: true,
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async getExpense(userId: string, groupId: string, expenseId: string) {
    await this.groupAccess.ensureMember(userId, groupId);

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      select: {
        id: true,
        groupId: true,
        description: true,
        amount: true,
        paidByUserId: true,
        createdAt: true,
        splits: { select: { userId: true, amount: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async updateExpense(userId: string, groupId: string, expenseId: string, dto: UpdateExpenseDto) {
    await this.groupAccess.ensureMember(userId, groupId);

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      select: { id: true, paidByUserId: true },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!members.length) {
      throw new BadRequestException('Group has no members');
    }

    const base = Math.floor(dto.amount / members.length);
    const remainder = dto.amount % members.length;
    const splits = members.map((member, index) => ({
      userId: member.userId,
      amount: index < remainder ? base + 1 : base,
    }));

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: dto.description,
          amount: dto.amount,
        },
        select: {
          id: true,
          groupId: true,
          description: true,
          amount: true,
          paidByUserId: true,
          createdAt: true,
        },
      });

      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      await tx.expenseSplit.createMany({
        data: splits.map((split) => ({
          expenseId,
          userId: split.userId,
          amount: split.amount,
        })),
      });

      return expense;
    });
  }

  async deleteExpense(userId: string, groupId: string, expenseId: string) {
    await this.groupAccess.ensureMember(userId, groupId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      select: { id: true, paidByUserId: true },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found');
    }

    if (existing.paidByUserId !== userId && group.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own expenses unless you own the group',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });
      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    return { ok: true };
  }

  async deleteAllForGroup(groupId: string, tx: Prisma.TransactionClient = this.prisma) {
    await tx.expenseSplit.deleteMany({
      where: { expense: { groupId } },
    });
    await tx.expense.deleteMany({
      where: { groupId },
    });
  }

  async deleteAllForMemberInGroup(
    groupId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const remainingMembers = await tx.groupMember.findMany({
      where: { groupId, userId: { not: userId } },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    });

    const memberCreatedExpenses = await tx.expense.findMany({
      where: {
        groupId,
        paidByUserId: userId,
      },
      select: { id: true },
    });

    if (memberCreatedExpenses.length) {
      const createdExpenseIds = memberCreatedExpenses.map((expense) => expense.id);
      await tx.expenseSplit.deleteMany({
        where: { expenseId: { in: createdExpenseIds } },
      });
      await tx.expense.deleteMany({
        where: { id: { in: createdExpenseIds } },
      });
    }

    if (!remainingMembers.length) {
      return;
    }

    const remainingExpenses = await tx.expense.findMany({
      where: { groupId },
      select: { id: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!remainingExpenses.length) {
      return;
    }

    const expenseIds = remainingExpenses.map((expense) => expense.id);
    await tx.expenseSplit.deleteMany({
      where: { expenseId: { in: expenseIds } },
    });

    const splitData = remainingExpenses.flatMap((expense) => {
      const base = Math.floor(expense.amount / remainingMembers.length);
      const remainder = expense.amount % remainingMembers.length;
      return remainingMembers.map((member, index) => ({
        expenseId: expense.id,
        userId: member.userId,
        amount: index < remainder ? base + 1 : base,
      }));
    });

    await tx.expenseSplit.createMany({
      data: splitData,
    });
  }

  private async ensureUsersInGroup(groupId: string, userIds: string[]) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, userId: { in: userIds } },
      select: { userId: true },
    });

    if (members.length !== userIds.length) {
      throw new BadRequestException('User not in group');
    }
  }
}
