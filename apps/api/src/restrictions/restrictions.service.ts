import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Restriction } from '../entities/restriction.entity'
import { CreateRestrictionDto } from '@lotto/shared'

@Injectable()
export class RestrictionsService {
  constructor(
    @InjectRepository(Restriction) private readonly restrictionsRepo: Repository<Restriction>,
  ) {}

  findAll(roundId: string) {
    return this.restrictionsRepo.find({
      where: { round_id: roundId },
      order: { created_at: 'DESC' },
    })
  }

  create(roundId: string, dto: CreateRestrictionDto) {
    const restriction = this.restrictionsRepo.create({
      ...dto,
      round_id: roundId,
      limit_amount: dto.limit_amount != null ? String(dto.limit_amount) : null,
    })
    return this.restrictionsRepo.save(restriction)
  }

  async remove(id: string) {
    const restriction = await this.restrictionsRepo.findOne({ where: { id } })
    if (!restriction) throw new NotFoundException('ไม่พบเลขอั้น')
    restriction.deleted_at = new Date()
    return this.restrictionsRepo.save(restriction)
  }
}
