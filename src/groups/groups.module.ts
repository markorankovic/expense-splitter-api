import { Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [ExpensesModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
