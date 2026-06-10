import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Bet } from '../entities/bet.entity'
import { BetItem } from '../entities/bet-item.entity'
import { Restriction } from '../entities/restriction.entity'
import { PrizeRate } from '../entities/prize-rate.entity'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryType } from '../entities/lottery-type.entity'
import { House } from '../entities/house.entity'
import { BetsService } from './bets.service'
import { BetsController } from './bets.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Bet, BetItem, Restriction, PrizeRate, LotteryRound, LotteryType, House])],
  providers: [BetsService],
  controllers: [BetsController],
  exports: [BetsService],
})
export class BetsModule {}
