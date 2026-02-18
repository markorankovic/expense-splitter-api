import { Module } from '@nestjs/common';
import { GroupAccessService } from '../common/group-access.service';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';

@Module({
  controllers: [BalancesController],
  providers: [BalancesService, GroupAccessService],
})
export class BalancesModule {}
