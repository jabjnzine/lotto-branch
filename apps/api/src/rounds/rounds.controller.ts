import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { RoundsService } from './rounds.service'
import { RoundsSchedulerService } from './rounds-scheduler.service'
import { ThaiLottoFetcherService } from './thai-lotto-fetcher.service'
import { LaoLottoFetcherService } from './lao-lotto-fetcher.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryResult } from '../entities/lottery-result.entity'
import { RoundStatus } from '@lotto/shared'

@Controller('rounds')
@UseGuards(JwtAuthGuard)
export class RoundsController {
  constructor(
    private readonly service: RoundsService,
    private readonly scheduler: RoundsSchedulerService,
    private readonly fetcher: ThaiLottoFetcherService,
    private readonly laoFetcher: LaoLottoFetcherService,
  ) {}

  @Get()
  findAll(
    @Query('lotteryTypeId') lotteryTypeId?: string,
    @Query('status') status?: RoundStatus,
    @Query('date') date?: string,
  ) {
    return this.service.findAll(lotteryTypeId, status, date)
  }

  @Get('current')
  findCurrent(@Query('lotteryTypeId') lotteryTypeId: string) {
    return this.service.findCurrent(lotteryTypeId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post('generate')
  generateRounds() {
    return this.scheduler.generateUpcomingRounds()
  }

  @Post()
  create(@Body() dto: Partial<LotteryRound>) {
    return this.service.create(dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: RoundStatus) {
    return this.service.updateStatus(id, status)
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id)
  }

  @Get(':id/result')
  getResult(@Param('id') id: string) {
    return this.service.getResult(id)
  }

  @Post('fetch-thai')
  fetchThaiResult() {
    return this.fetcher.fetchLatestAndSave()
  }

  @Post('fetch-lao')
  fetchLaoResult() {
    return this.laoFetcher.fetchLatestAndSave()
  }

  @Post(':id/result')
  saveResult(@Param('id') id: string, @Body() dto: Partial<LotteryResult>) {
    return this.service.saveResult(id, dto)
  }
}
