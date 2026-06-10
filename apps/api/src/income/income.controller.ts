import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { IncomeService } from './income.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Get('today')
  getTodayIncome() {
    return this.service.getTodayIncome()
  }

  @Get('summary')
  getSummary(@Query('roundId') roundId: string) {
    return this.service.getSummaryByRound(roundId)
  }

  @Get('summary/per-house')
  getSummaryPerHouse(@Query('roundId') roundId: string) {
    return this.service.getSummaryByRoundPerHouse(roundId)
  }
}
