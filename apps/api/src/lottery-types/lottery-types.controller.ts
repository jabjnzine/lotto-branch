import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { LotteryTypesService } from './lottery-types.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LotteryType } from '../entities/lottery-type.entity'
import { PrizeRate } from '../entities/prize-rate.entity'

@Controller('lottery-types')
@UseGuards(JwtAuthGuard)
export class LotteryTypesController {
  constructor(private readonly service: LotteryTypesService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all === 'true')
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<LotteryType>) {
    return this.service.update(id, dto)
  }

  @Get(':id/prize-rates')
  getPrizeRates(@Param('id') id: string) {
    return this.service.getPrizeRates(id)
  }
}

@Controller('prize-rates')
@UseGuards(JwtAuthGuard)
export class PrizeRatesController {
  constructor(private readonly service: LotteryTypesService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<PrizeRate>) {
    return this.service.updatePrizeRate(id, dto)
  }
}
