import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LotteryType } from '../entities/lottery-type.entity'
import { PrizeRate } from '../entities/prize-rate.entity'
import { LotteryTypesService } from './lottery-types.service'
import { LotteryTypesController, PrizeRatesController } from './lottery-types.controller'

@Module({
  imports: [TypeOrmModule.forFeature([LotteryType, PrizeRate])],
  providers: [LotteryTypesService],
  controllers: [LotteryTypesController, PrizeRatesController],
  exports: [LotteryTypesService],
})
export class LotteryTypesModule {}
