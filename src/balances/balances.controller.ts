import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BalancesService } from './balances.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('balances')
  getBalances(@Req() req: AuthRequest, @Param('groupId') groupId: string) {
    return this.balancesService.getBalances(req.user.id, groupId);
  }

  @Get('settle')
  getSettle(@Req() req: AuthRequest, @Param('groupId') groupId: string) {
    return this.balancesService.getSettle(req.user.id, groupId);
  }
}
