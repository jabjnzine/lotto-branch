import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BetItem } from '../entities/bet-item.entity'
import { Bet } from '../entities/bet.entity'
import { LotteryType } from '../entities/lottery-type.entity'
import { House } from '../entities/house.entity'
import { User } from '../entities/user.entity'
import { IncomeService } from './income.service'
import { IncomeController } from './income.controller'

@Module({
  imports: [TypeOrmModule.forFeature([BetItem, Bet, LotteryType, House, User])],
  providers: [IncomeService],
  controllers: [IncomeController],
})
export class IncomeModule {}
