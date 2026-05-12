import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryResult } from '../entities/lottery-result.entity'
import { LotteryType } from '../entities/lottery-type.entity'
import { Bet } from '../entities/bet.entity'
import { RoundsService } from './rounds.service'
import { RoundsController } from './rounds.controller'
import { RoundsSchedulerService } from './rounds-scheduler.service'

@Module({
  imports: [TypeOrmModule.forFeature([LotteryRound, LotteryResult, LotteryType, Bet])],
  providers: [RoundsService, RoundsSchedulerService],
  controllers: [RoundsController],
  exports: [RoundsService],
})
export class RoundsModule {}
