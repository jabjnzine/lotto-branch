import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  StreamableFile,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import Decimal from 'decimal.js'
import * as ExcelJS from 'exceljs'
import { Bet } from '../entities/bet.entity'
import { BetItem } from '../entities/bet-item.entity'
import { Restriction } from '../entities/restriction.entity'
import { PrizeRate } from '../entities/prize-rate.entity'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryResult } from '../entities/lottery-result.entity'
import { LotteryType } from '../entities/lottery-type.entity'
import { House } from '../entities/house.entity'
import { BetStatus, RestrictionType, RoundStatus, ResultStructure, BetType, CreateBetDto, BET_TYPE_LABEL } from '@lotto/shared'
import { getWinningDigits, isMatch } from './prize-checker'

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name)

  constructor(
    @InjectRepository(Bet) private readonly betsRepo: Repository<Bet>,
    @InjectRepository(PrizeRate) private readonly prizeRatesRepo: Repository<PrizeRate>,
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
    @InjectRepository(LotteryType) private readonly lotteryTypesRepo: Repository<LotteryType>,
    @InjectRepository(House) private readonly housesRepo: Repository<House>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(roundId: string, page = 1, pageSize = 20, search?: string) {
    const qb = this.betsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.items', 'bi')
      .leftJoinAndSelect('b.user', 'u')
      .where('b.round_id = :roundId', { roundId })

    if (search && search.trim()) {
      qb.andWhere('(b.buyer_name ILIKE :search OR bi.number LIKE :search)', {
        search: `%${search.trim()}%`,
      })
    }

    const [items, total] = await qb
      .orderBy('b.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

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

  private async getCommissionRates(houseId?: string | null): Promise<{ houseRate: Decimal; agentRate: Decimal }> {
    let houseRate = new Decimal(0)
    if (houseId) {
      const house = await this.housesRepo.findOne({ where: { id: houseId } })
      if (house) houseRate = new Decimal(house.commission_rate)
    }
    return { houseRate, agentRate: new Decimal(100) }
  }

  async create(dto: CreateBetDto, userId: string) {
    const round = await this.roundsRepo.findOne({ where: { id: dto.round_id } })
    if (!round) throw new NotFoundException('ไม่พบงวด')
    if (round.status !== RoundStatus.OPEN) {
      throw new BadRequestException('งวดนี้ปิดรับแทงแล้ว')
    }

    const { houseRate, agentRate } = await this.getCommissionRates(dto.house_id)

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

        const amt = new Decimal(item.amount)
        totalAmount = totalAmount.plus(amt)
        const commissionAmount = amt.mul(houseRate).div(100)
        const agentCommissionAmount = amt.mul(agentRate.minus(houseRate)).div(100)
        betItems.push({
          number: item.number,
          bet_type: item.bet_type,
          amount: amt.toFixed(2),
          payout_rate: prizeRate.payout_rate,
          commission_amount: commissionAmount.toFixed(2),
          agent_commission_amount: agentCommissionAmount.toFixed(2),
        })
      }

      const bet = manager.getRepository(Bet).create({
        round_id: dto.round_id,
        lottery_type_id: dto.lottery_type_id,
        user_id: userId,
        house_id: dto.house_id ?? null,
        buyer_name: dto.buyer_name ?? null,
        note: dto.note ?? null,
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

  async calculateWinners(roundId: string) {
    const round = await this.roundsRepo.findOne({ where: { id: roundId } })
    if (!round) throw new NotFoundException('ไม่พบงวด')

    const lotteryType = await this.lotteryTypesRepo.findOne({ where: { id: round.lottery_type_id } })
    if (!lotteryType) throw new NotFoundException('ไม่พบประเภทหวย')

    const result = await this.dataSource.getRepository(LotteryResult).findOne({ where: { round_id: roundId } })
    if (!result) return

    const structure = lotteryType.result_structure as ResultStructure

    const bets = await this.betsRepo.find({
      where: { round_id: roundId, status: BetStatus.PENDING },
      relations: ['items'],
    })

    if (bets.length === 0) return

    this.logger.log(`คำนวณถูก-ผิด ${bets.length} บิล สำหรับงวด ${roundId}`)

    const { topDigits, bottomDigits } = getWinningDigits(structure, {
      first_prize: result.first_prize,
      two_last: result.two_last,
      three_front: result.three_front,
    })

    const frontSet = new Set<string>()
    if (Array.isArray(result.three_front)) {
      for (const n of result.three_front) frontSet.add(String(n))
    }
    const backSet = new Set<string>()
    if (Array.isArray(result.three_back)) {
      for (const n of result.three_back) backSet.add(String(n))
    }
    const patthanaSet = new Set<string>()
    if (structure === ResultStructure.LAO_5_2 && Array.isArray(result.three_front)) {
      for (const n of result.three_front) patthanaSet.add(String(n))
    }

    const matchContext = { topDigits, bottomDigits, frontSet, backSet, patthanaSet, structure }

    await this.dataSource.transaction(async (manager) => {
      for (const bet of bets) {
        let hasWon = false
        for (const item of bet.items) {
          if (isMatch(item.number, item.bet_type as BetType, matchContext)) {
            const winAmount = new Decimal(item.amount).times(item.payout_rate)
            item.win_amount = winAmount.toFixed(2)
            hasWon = true
          } else {
            item.win_amount = '0'
          }
          await manager.getRepository(BetItem).save(item)
        }
        bet.status = hasWon ? BetStatus.WON : BetStatus.LOST
        await manager.getRepository(Bet).save(bet)
      }
    })

    this.logger.log(`คำนวณเสร็จ: ${bets.length} บิล`)
  }

  async getRoundSummary(roundId: string) {
    const bets = await this.betsRepo.find({
      where: { round_id: roundId },
      relations: ['items'],
    })

    const won = bets.filter((b) => b.status === BetStatus.WON)
    const lost = bets.filter((b) => b.status === BetStatus.LOST)
    const cancelled = bets.filter((b) => b.status === BetStatus.CANCELLED)

    const totalReceived = bets.reduce((sum, b) => sum + Number(b.total_amount), 0)
    const totalPayout = won.reduce(
      (sum, b) => sum + b.items.reduce((s, i) => s + Number(i.win_amount ?? 0), 0),
      0,
    )

    return {
      totalBets: bets.length,
      wonCount: won.length,
      lostCount: lost.length,
      cancelledCount: cancelled.length,
      totalReceived,
      totalPayout,
      profit: totalReceived - totalPayout,
    }
  }

  async getTodayAll(page = 1, pageSize = 20, search?: string) {
    const today = new Date().toISOString().slice(0, 10)

    const qb = this.betsRepo
      .createQueryBuilder('b')
      .innerJoinAndSelect('b.items', 'bi')
      .innerJoinAndSelect('b.round', 'r')
      .innerJoinAndSelect('r.lottery_type', 'lt')
      .where('r.draw_date = :today', { today })
      .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })

    if (search && search.trim()) {
      qb.andWhere('(b.buyer_name ILIKE :search OR bi.number LIKE :search)', {
        search: `%${search.trim()}%`,
      })
    }

    const total = await qb.getCount()

    const bets = await qb
      .orderBy('b.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    const grouped: Record<string, {
      typeId: string
      typeName: string
      typeCode: string
      roundId: string
      drawDate: string
      bets: typeof bets
      totalAmount: number
      betCount: number
      itemCount: number
    }> = {}

    for (const bet of bets) {
      const typeId = bet.round.lottery_type.id
      if (!grouped[typeId]) {
        grouped[typeId] = {
          typeId,
          typeName: bet.round.lottery_type.name,
          typeCode: bet.round.lottery_type.code,
          roundId: bet.round.id,
          drawDate: bet.round.draw_date,
          bets: [],
          totalAmount: 0,
          betCount: 0,
          itemCount: 0,
        }
      }
      grouped[typeId].bets.push(bet)
      grouped[typeId].totalAmount += Number(bet.total_amount)
      grouped[typeId].betCount++
      grouped[typeId].itemCount += bet.items.length
    }

    const totalAmount = bets.reduce((sum, b) => sum + Number(b.total_amount), 0)

    return {
      date: today,
      totalBets: total,
      totalAmount,
      groups: Object.values(grouped),
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async getTodaySummary() {
    const today = new Date().toISOString().slice(0, 10)

    const result = await this.betsRepo
      .createQueryBuilder('b')
      .innerJoin('b.round', 'r')
      .where('r.draw_date = :today', { today })
      .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })
      .select([
        'COUNT(b.id) AS "billCount"',
        'COALESCE(SUM(b.total_amount), 0) AS "totalAmount"',
      ])
      .getRawOne<{ billCount: string; totalAmount: string }>()

    return {
      billCount: Number(result?.billCount ?? 0),
      totalAmount: result?.totalAmount ?? '0',
    }
  }

  async exportRound(roundId: string): Promise<{ buffer: Buffer; filename: string }> {
    const bets = await this.betsRepo.find({
      where: { round_id: roundId, status: BetStatus.PENDING },
      relations: ['items', 'round', 'round.lottery_type'],
      order: { created_at: 'ASC' },
    })

    const round = bets[0]?.round
    const drawDate = round?.draw_date ?? 'unknown'
    const typeName = round?.lottery_type?.name ?? ''

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('รายการบิล')

    ws.columns = [
      { header: 'ลำดับ', key: 'row', width: 6 },
      { header: 'เวลา', key: 'time', width: 8 },
      { header: 'คนซื้อ', key: 'buyer', width: 16 },
      { header: 'เลข', key: 'number', width: 10 },
      { header: 'ประเภท', key: 'betType', width: 14 },
      { header: 'ยอด (บาท)', key: 'amount', width: 12 },
      { header: 'สถานะ', key: 'status', width: 10 },
    ]

    // Style headers
    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }

    let rowNum = 2
    let total = 0
    for (const bet of bets) {
      const time = bet.created_at ? new Date(bet.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''
      const buyer = bet.buyer_name ?? '—'

      for (const item of bet.items) {
        ws.addRow({
          row: rowNum - 1,
          time,
          buyer,
          number: item.number,
          betType: BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type,
          amount: Number(item.amount),
          status: bet.status,
        })
        total += Number(item.amount)
        rowNum++
      }
    }

    // Total row
    ws.addRow({})
    const totalRow = ws.addRow({
      row: '',
      time: '',
      buyer: '',
      number: '',
      betType: 'รวมทั้งสิ้น',
      amount: total,
      status: '',
    })
    totalRow.font = { bold: true }
    totalRow.getCell('amount').numFmt = '#,##0.00'

    const buffer = await wb.xlsx.writeBuffer()
    return { buffer: Buffer.from(buffer), filename: `bills_${typeName}_${drawDate}.xlsx` }
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
