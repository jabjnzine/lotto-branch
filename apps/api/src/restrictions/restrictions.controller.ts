import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'
import { RestrictionsService } from './restrictions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateRestrictionDto } from '@lotto/shared'

@Controller('rounds/:roundId/restrictions')
@UseGuards(JwtAuthGuard)
export class RestrictionsController {
  constructor(private readonly service: RestrictionsService) {}

  @Get()
  findAll(@Param('roundId') roundId: string) {
    return this.service.findAll(roundId)
  }

  @Post()
  create(@Param('roundId') roundId: string, @Body() dto: CreateRestrictionDto) {
    return this.service.create(roundId, dto)
  }
}

@Controller('restrictions')
@UseGuards(JwtAuthGuard)
export class RestrictionItemController {
  constructor(private readonly service: RestrictionsService) {}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
