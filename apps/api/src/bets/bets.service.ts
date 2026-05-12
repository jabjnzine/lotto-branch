import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import Decimal from 'decimal.js'
import { Bet } from '../entities/bet.entity'
import { BetItem } from '../entities/bet-item.entity'
import { Restriction } from '../entities/restriction.entity'
import { PrizeRate } from '../entities/prize-rate.entity'
import { LotteryRound } from '../entities/lottery-round.entity'
import { BetStatus, RestrictionType, RoundStatus, CreateBetDto } from '@lotto/shared'

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet) private readonly betsRepo: Repository<Bet>,
    @InjectRepository(PrizeRate) private readonly prizeRatesRepo: Repository<PrizeRate>,
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(roundId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.betsRepo.findAndCount({
      where: { round_id: roundId },
      relations: ['items', 'user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  async findOne(id: string) {
    const bet = await this.betsRepo.findOne({
      where: { id },
      relations: ['items', 'user', 'round'],
    })
    if (!bet) throw new NotFoundException('ไม่พบบิล')
    return bet
  }

  async create(dto: CreateBetDto, userId: string) {
    const round = await this.roundsRepo.findOne({ where: { id: dto.round_id } })
    if (!round) throw new NotFoundException('ไม่พบงวด')
    if (round.status !== RoundStatus.OPEN) {
      throw new BadRequestException('งวดนี้ปิดรับแทงแล้ว')
    }

    return this.dataSource.transaction(async (manager) => {
      // ดึง prize rates สำหรับ lottery type นี้
      const prizeRates = await manager.getRepository(PrizeRate).find({
        where: { lottery_type_id: dto.lottery_type_id },
      })
      const rateMap = new Map(prizeRates.map((pr) => [pr.bet_type, pr]))

      // validate แต่ละ item + เช็ค restriction
      let totalAmount = new Decimal(0)
      const betItems: Partial<BetItem>[] = []

      for (const item of dto.items) {
        const restriction = await manager
          .getRepository(Restriction)
          .createQueryBuilder('r')
          .setLock('pessimistic_write')
          .where('r.round_id = :roundId', { roundId: dto.round_id })
          .andWhere('r.number = :number', { number: item.number })
          .andWhere('r.bet_type = :betType', { betType: item.bet_type })
          .andWhere('r.deleted_at IS NULL')
          .getOne()

        if (restriction) {
          if (restriction.restriction_type === RestrictionType.CLOSED) {
            throw new BadRequestException(`เลข ${item.number} ปิดรับแล้ว`)
          }

          if (restriction.restriction_type === RestrictionType.LIMITED && restriction.limit_amount) {
            const accepted = await manager
              .getRepository(BetItem)
              .createQueryBuilder('bi')
              .innerJoin('bi.bet', 'b')
              .where('b.round_id = :roundId', { roundId: dto.round_id })
              .andWhere('bi.number = :number', { number: item.number })
              .andWhere('bi.bet_type = :betType', { betType: item.bet_type })
              .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })
              .andWhere('b.deleted_at IS NULL')
              .select('SUM(bi.amount)', 'total')
              .getRawOne<{ total: string }>()

            const totalAccepted = new Decimal(accepted?.total ?? 0)
            const remaining = new Decimal(restriction.limit_amount).minus(totalAccepted)

            if (remaining.lte(0)) {
              throw new BadRequestException(`เลข ${item.number} เต็มแล้ว`)
            }
            if (new Decimal(item.amount).gt(remaining)) {
              throw new BadRequestException(
                `เลข ${item.number} รับได้อีกแค่ ${remaining.toFixed(2)} บาท`,
              )
            }
          }
        }

        const prizeRate = rateMap.get(item.bet_type)
        if (!prizeRate) {
          throw new BadRequestException(`ประเภทการแทง ${item.bet_type} ไม่รองรับ`)
        }

        totalAmount = totalAmount.plus(item.amount)
        betItems.push({
          number: item.number,
          bet_type: item.bet_type,
          amount: String(item.amount),
          payout_rate: prizeRate.payout_rate,
        })
      }

      const bet = manager.getRepository(Bet).create({
        round_id: dto.round_id,
        lottery_type_id: dto.lottery_type_id,
        user_id: userId,
        note: dto.note,
        total_amount: totalAmount.toFixed(2),
        status: BetStatus.PENDING,
      })
      const savedBet = await manager.getRepository(Bet).save(bet)

      const items = betItems.map((item) =>
        manager.getRepository(BetItem).create({ ...item, bet_id: savedBet.id }),
      )
      await manager.getRepository(BetItem).save(items)

      return { ...savedBet, items }
    })
  }

  async cancel(id: string) {
    const bet = await this.findOne(id)
    if (bet.status === BetStatus.CANCELLED) {
      throw new BadRequestException('บิลนี้ถูกยกเลิกแล้ว')
    }
    bet.status = BetStatus.CANCELLED
    bet.deleted_at = new Date()
    return this.betsRepo.save(bet)
  }
}
