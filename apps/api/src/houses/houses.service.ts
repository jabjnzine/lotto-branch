import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import Decimal from 'decimal.js'
import { House } from '../entities/house.entity'
import { SystemConfig } from '../entities/system-config.entity'

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House) private readonly housesRepo: Repository<House>,
    @InjectRepository(SystemConfig) private readonly configRepo: Repository<SystemConfig>,
  ) {}

  async findAll() {
    return this.housesRepo.find({ where: { deleted_at: IsNull() }, order: { created_at: 'ASC' } })
  }

  async findOne(id: string) {
    const house = await this.housesRepo.findOne({ where: { id, deleted_at: IsNull() } })
    if (!house) throw new NotFoundException('ไม่พบบ้าน')
    return house
  }

  async create(name: string, commissionRate: number, ownerId: string) {
    await this.validateRate(commissionRate)
    const house = this.housesRepo.create({
      name,
      owner_id: ownerId,
      commission_rate: String(commissionRate),
    })
    return this.housesRepo.save(house)
  }

  async update(id: string, name?: string, commissionRate?: number) {
    const house = await this.findOne(id)
    if (commissionRate !== undefined) {
      await this.validateRate(commissionRate)
      house.commission_rate = String(commissionRate)
    }
    if (name !== undefined) house.name = name
    return this.housesRepo.save(house)
  }

  async remove(id: string) {
    const house = await this.findOne(id)
    house.deleted_at = new Date()
    return this.housesRepo.save(house)
  }

  async getAgentRate(): Promise<Decimal> {
    const cfg = await this.configRepo.findOne({ where: { key: 'agent_commission_rate' } })
    return new Decimal(cfg?.value ?? 0)
  }

  async setAgentRate(rate: number) {
    if (rate < 0 || rate > 100) throw new BadRequestException('% ต้องอยู่ระหว่าง 0–100')
    await this.configRepo.upsert({ key: 'agent_commission_rate', value: String(rate) }, ['key'])
    return { agent_commission_rate: rate }
  }

  private async validateRate(rate: number) {
    if (rate < 0 || rate > 100) throw new BadRequestException('% ต้องอยู่ระหว่าง 0–100')
    const agentRate = await this.getAgentRate()
    if (new Decimal(rate).gt(agentRate)) {
      throw new BadRequestException(`% บ้านต้องไม่เกิน % เจ้า (${agentRate.toFixed(2)}%)`)
    }
  }
}
