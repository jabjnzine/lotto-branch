import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LotteryType } from '../entities/lottery-type.entity'
import { PrizeRate } from '../entities/prize-rate.entity'

@Injectable()
export class LotteryTypesService {
  constructor(
    @InjectRepository(LotteryType) private readonly lotteryTypesRepo: Repository<LotteryType>,
    @InjectRepository(PrizeRate) private readonly prizeRatesRepo: Repository<PrizeRate>,
  ) {}

  findAll() {
    return this.lotteryTypesRepo.find({ where: { is_active: true }, order: { name: 'ASC' } })
  }

  async findOne(id: string) {
    const lt = await this.lotteryTypesRepo.findOne({ where: { id } })
    if (!lt) throw new NotFoundException('ไม่พบประเภทหวย')
    return lt
  }

  async update(id: string, dto: Partial<LotteryType>) {
    const lt = await this.findOne(id)
    Object.assign(lt, dto)
    return this.lotteryTypesRepo.save(lt)
  }

  async getPrizeRates(lotteryTypeId: string) {
    await this.findOne(lotteryTypeId)
    return this.prizeRatesRepo.find({ where: { lottery_type_id: lotteryTypeId } })
  }

  async updatePrizeRate(id: string, dto: Partial<PrizeRate>) {
    const pr = await this.prizeRatesRepo.findOne({ where: { id } })
    if (!pr) throw new NotFoundException('ไม่พบอัตราจ่าย')
    Object.assign(pr, dto)
    return this.prizeRatesRepo.save(pr)
  }
}
