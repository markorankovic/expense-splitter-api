import { Module } from '@nestjs/common';
import { GroupAccessService } from '../common/group-access.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, GroupAccessService],
})
export class ExpensesModule {}
