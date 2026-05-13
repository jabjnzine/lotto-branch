import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common'
import type { Response } from 'express'
import { BetsService } from './bets.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CreateBetDto } from '@lotto/shared'

@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly service: BetsService) {}

  @Get()
  findAll(
    @Query('roundId') roundId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll(roundId, page ? +page : 1, pageSize ? +pageSize : 20)
  }

  @Get('export')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async export(
    @Query('roundId') roundId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.service.exportRound(roundId)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    return buffer
  }

  @Get('today-summary')
  getTodaySummary() {
    return this.service.getTodaySummary()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateBetDto, @CurrentUser() user: { id: string }) {
    return this.service.create(dto, user.id)
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id)
  }
}
