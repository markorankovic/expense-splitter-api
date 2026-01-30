import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(userId: string, groupId: string, dto: CreateExpenseDto) {
    await this.ensureMember(userId, groupId);

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
    await this.ensureMember(userId, groupId);

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
    await this.ensureMember(userId, groupId);

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
