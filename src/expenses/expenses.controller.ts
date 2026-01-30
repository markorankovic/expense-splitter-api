import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(req.user.id, groupId, dto);
  }

  @Get()
  list(@Req() req: AuthRequest, @Param('groupId') groupId: string) {
    return this.expensesService.listExpenses(req.user.id, groupId);
  }

  @Get(':expenseId')
  get(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.getExpense(req.user.id, groupId, expenseId);
  }
}
