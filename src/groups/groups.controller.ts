import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.groupsService.listGroups(req.user.id);
  }

  @Get(':id')
  get(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.groupsService.getGroup(req.user.id, id);
  }

  @Post(':id/members')
  addMember(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(req.user.id, id, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.groupsService.removeMember(req.user.id, id, userId);
  }
}
