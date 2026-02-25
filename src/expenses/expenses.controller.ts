import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
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
  list(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Query() query: PaginationDto,
  ) {
    return this.expensesService.listExpenses(req.user.id, groupId, query);
  }

  @Get(':expenseId')
  get(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.getExpense(req.user.id, groupId, expenseId);
  }

  @Patch(':expenseId')
  update(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(req.user.id, groupId, expenseId, dto);
  }

  @Delete(':expenseId')
  delete(
    @Req() req: AuthRequest,
    @Param('groupId') groupId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.expensesService.deleteExpense(req.user.id, groupId, expenseId);
  }
}
