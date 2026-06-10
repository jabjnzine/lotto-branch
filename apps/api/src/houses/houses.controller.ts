import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { HousesService } from './houses.service'

@UseGuards(JwtAuthGuard)
@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  findAll() {
    return this.housesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.housesService.findOne(id)
  }

  @Post()
  create(@Body() body: { name: string; commission_rate: number }, @Request() req: { user: { id: string } }) {
    return this.housesService.create(body.name, body.commission_rate ?? 0, req.user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; commission_rate?: number }) {
    return this.housesService.update(id, body.name, body.commission_rate)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.housesService.remove(id)
  }

  @Get('config/agent-rate')
  getAgentRate() {
    return this.housesService.getAgentRate().then((r) => ({ agent_commission_rate: r.toNumber() }))
  }

  @Patch('config/agent-rate')
  setAgentRate(@Body() body: { agent_commission_rate: number }) {
    return this.housesService.setAgentRate(body.agent_commission_rate)
  }
}
