import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          ownerId: userId,
        },
        select: { id: true, name: true, createdAt: true, ownerId: true },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'owner',
        },
      });

      return group;
    });
  }

  async listGroups(userId: string, pagination?: { page?: number; pageSize?: number }) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = { members: { some: { userId } } };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        select: { id: true, name: true, createdAt: true, ownerId: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.group.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async getGroup(userId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, members: { some: { userId } } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        ownerId: true,
        members: {
          select: {
            role: true,
            createdAt: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      ownerId: group.ownerId,
      members: group.members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        role: member.role,
        joinedAt: member.createdAt,
      })),
    };
  }

  async addMember(userId: string, groupId: string, dto: AddMemberDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== userId) {
      throw new ForbiddenException('Only owner can add members');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('User already a member');
    }

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: 'member',
      },
      select: {
        role: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    });

    return {
      id: membership.user.id,
      email: membership.user.email,
      role: membership.role,
      joinedAt: membership.createdAt,
    };
  }

  async removeMember(userId: string, groupId: string, memberId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, ownerId: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.ownerId !== userId) {
      throw new ForbiddenException('Only owner can remove members');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return { ok: true };
  }
}
