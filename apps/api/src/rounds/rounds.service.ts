import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { forwardRef, Inject } from '@nestjs/common'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryResult } from '../entities/lottery-result.entity'
import { Bet } from '../entities/bet.entity'
import { BetsService } from '../bets/bets.service'
import { RoundStatus, BetStatus } from '@lotto/shared'

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
    @InjectRepository(LotteryResult) private readonly resultsRepo: Repository<LotteryResult>,
    @InjectRepository(Bet) private readonly betsRepo: Repository<Bet>,
    @Inject(forwardRef(() => BetsService)) private readonly betsService: BetsService,
  ) {}

  findAll(lotteryTypeId?: string, status?: RoundStatus) {
    const where: Record<string, unknown> = {}
    if (lotteryTypeId) where['lottery_type_id'] = lotteryTypeId
    if (status) where['status'] = status
    return this.roundsRepo.find({ where, order: { draw_date: 'DESC' }, relations: ['lottery_type'] })
  }

  async findCurrent(lotteryTypeId: string) {
    return this.roundsRepo.findOne({
      where: { lottery_type_id: lotteryTypeId, status: RoundStatus.OPEN },
      relations: ['lottery_type'],
      order: { draw_date: 'ASC' },
    })
  }

  async findOne(id: string) {
    const round = await this.roundsRepo.findOne({ where: { id }, relations: ['lottery_type'] })
    if (!round) throw new NotFoundException('ไม่พบงวด')
    return round
  }

  async create(dto: Partial<LotteryRound>) {
    const existing = await this.roundsRepo.findOne({
      where: { lottery_type_id: dto.lottery_type_id, draw_date: dto.draw_date },
    })
    if (existing) throw new ConflictException('งวดวันนี้มีอยู่แล้ว')
    return this.roundsRepo.save({ ...dto, status: RoundStatus.OPEN })
  }

  async updateStatus(id: string, status: RoundStatus) {
    const round = await this.findOne(id)
    round.status = status
    return this.roundsRepo.save(round)
  }

  async cancel(id: string) {
    const round = await this.findOne(id)
    if (round.status === RoundStatus.RESULTED) {
      throw new BadRequestException('ไม่สามารถยกเลิกงวดที่ออกผลแล้ว')
    }
    round.status = RoundStatus.CANCELLED

    // ยกเลิกบิลทั้งหมดในงวดนี้
    await this.betsRepo
      .createQueryBuilder()
      .update(Bet)
      .set({ status: BetStatus.CANCELLED })
      .where('round_id = :id', { id })
      .andWhere('status != :cancelled', { cancelled: BetStatus.CANCELLED })
      .execute()

    return this.roundsRepo.save(round)
  }

  async getResult(roundId: string) {
    return this.resultsRepo.findOne({ where: { round_id: roundId } })
  }

  async saveResult(roundId: string, dto: Partial<LotteryResult>) {
    const round = await this.findOne(roundId)
    if (round.status === RoundStatus.CANCELLED) {
      throw new BadRequestException('ไม่สามารถบันทึกผลงวดที่ยกเลิกแล้ว')
    }

    const existing = await this.resultsRepo.findOne({ where: { round_id: roundId } })
    let saved: LotteryResult
    if (existing) {
      Object.assign(existing, dto)
      saved = await this.resultsRepo.save(existing)
    } else {
      const result = this.resultsRepo.create({ ...dto, round_id: roundId })
      saved = await this.resultsRepo.save(result)
    }

    await this.updateStatus(roundId, RoundStatus.RESULTED)

    // คำนวณถูก-ผิดทุกบิลในงวดนี้
    this.betsService.calculateWinners(roundId).catch((err) => {
      console.error('คำนวณถูก-ผิดล้มเหลว:', err)
    })

    return saved
  }
}
