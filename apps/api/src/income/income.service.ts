import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Decimal from 'decimal.js'
import { BetItem } from '../entities/bet-item.entity'
import { Bet } from '../entities/bet.entity'
import { LotteryType } from '../entities/lottery-type.entity'
import { House } from '../entities/house.entity'
import { User } from '../entities/user.entity'
import { BetStatus } from '@lotto/shared'

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(BetItem) private readonly betItemsRepo: Repository<BetItem>,
    @InjectRepository(Bet) private readonly betsRepo: Repository<Bet>,
    @InjectRepository(LotteryType) private readonly lotteryTypesRepo: Repository<LotteryType>,
    @InjectRepository(House) private readonly housesRepo: Repository<House>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async getTodayIncome() {
    const today = new Date().toISOString().slice(0, 10)

    const items = await this.betItemsRepo
      .createQueryBuilder('bi')
      .innerJoin('bi.bet', 'b')
      .innerJoin('b.round', 'r')
      .innerJoin('r.lottery_type', 'lt')
      .where('r.draw_date = :today', { today })
      .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })
      .andWhere('b.deleted_at IS NULL')
      .select([
        'lt.code AS "typeCode"',
        'lt.name AS "typeName"',
        'SUM(bi.amount) AS "received"',
        'SUM(COALESCE(bi.win_amount, 0)) AS "payout"',
        'SUM(bi.commission_amount) AS "houseCommission"',
        'SUM(bi.agent_commission_amount) AS "agentCommission"',
      ])
      .groupBy('lt.code, lt.name')
      .getRawMany<{
        typeCode: string
        typeName: string
        received: string
        payout: string
        houseCommission: string
        agentCommission: string
      }>()

    let totalReceived = new Decimal(0)
    let totalPayout = new Decimal(0)
    let totalHouseCommission = new Decimal(0)
    let totalAgentCommission = new Decimal(0)
    const byType = []

    for (const row of items) {
      const r = new Decimal(row.received ?? 0)
      const p = new Decimal(row.payout ?? 0)
      const hc = new Decimal(row.houseCommission ?? 0)
      const ac = new Decimal(row.agentCommission ?? 0)
      totalReceived = totalReceived.plus(r)
      totalPayout = totalPayout.plus(p)
      totalHouseCommission = totalHouseCommission.plus(hc)
      totalAgentCommission = totalAgentCommission.plus(ac)
      byType.push({
        typeCode: row.typeCode,
        typeName: row.typeName,
        received: r.toFixed(2),
        payout: p.toFixed(2),
        houseCommission: hc.toFixed(2),
        agentCommission: ac.toFixed(2),
        netAmount: r.minus(hc).minus(ac).toFixed(2),
        profit: r.minus(hc).minus(ac).minus(p).toFixed(2),
      })
    }

    const netAmount = totalReceived.minus(totalHouseCommission).minus(totalAgentCommission)
    const profit = netAmount.minus(totalPayout)

    return {
      totalReceived: totalReceived.toFixed(2),
      totalPayout: totalPayout.toFixed(2),
      totalHouseCommission: totalHouseCommission.toFixed(2),
      totalAgentCommission: totalAgentCommission.toFixed(2),
      netAmount: netAmount.toFixed(2),
      profit: profit.toFixed(2),
      isProfitable: profit.gte(0),
      byType,
    }
  }

  async getSummaryByRound(roundId: string) {
    const items = await this.betItemsRepo
      .createQueryBuilder('bi')
      .innerJoin('bi.bet', 'b')
      .where('b.round_id = :roundId', { roundId })
      .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })
      .andWhere('b.deleted_at IS NULL')
      .select([
        'b.lottery_type_id as lottery_type_id',
        'bi.bet_type as bet_type',
        'SUM(bi.amount) as received',
        'SUM(COALESCE(bi.win_amount, 0)) as payout',
        'SUM(bi.commission_amount) as house_commission',
        'SUM(bi.agent_commission_amount) as agent_commission',
      ])
      .groupBy('b.lottery_type_id, bi.bet_type')
      .getRawMany<{
        lottery_type_id: string
        bet_type: string
        received: string
        payout: string
        house_commission: string
        agent_commission: string
      }>()

    const lotteryTypes = await this.lotteryTypesRepo.find()
    const ltMap = new Map(lotteryTypes.map((lt) => [lt.id, lt]))

    let totalReceived = new Decimal(0)
    let totalPayout = new Decimal(0)
    let totalHouseCommission = new Decimal(0)
    let totalAgentCommission = new Decimal(0)

    const byLotteryTypeMap = new Map<
      string,
      { code: string; name: string; received: Decimal; payout: Decimal; houseCommission: Decimal; agentCommission: Decimal }
    >()
    const byBetTypeMap = new Map<string, { received: Decimal; payout: Decimal }>()

    for (const row of items) {
      const received = new Decimal(row.received ?? 0)
      const payout = new Decimal(row.payout ?? 0)
      const hc = new Decimal(row.house_commission ?? 0)
      const ac = new Decimal(row.agent_commission ?? 0)
      totalReceived = totalReceived.plus(received)
      totalPayout = totalPayout.plus(payout)
      totalHouseCommission = totalHouseCommission.plus(hc)
      totalAgentCommission = totalAgentCommission.plus(ac)

      const lt = ltMap.get(row.lottery_type_id)
      if (lt) {
        const existing = byLotteryTypeMap.get(lt.code) ?? {
          code: lt.code,
          name: lt.name,
          received: new Decimal(0),
          payout: new Decimal(0),
          houseCommission: new Decimal(0),
          agentCommission: new Decimal(0),
        }
        byLotteryTypeMap.set(lt.code, {
          ...existing,
          received: existing.received.plus(received),
          payout: existing.payout.plus(payout),
          houseCommission: existing.houseCommission.plus(hc),
          agentCommission: existing.agentCommission.plus(ac),
        })
      }

      const existingBt = byBetTypeMap.get(row.bet_type) ?? { received: new Decimal(0), payout: new Decimal(0) }
      byBetTypeMap.set(row.bet_type, {
        received: existingBt.received.plus(received),
        payout: existingBt.payout.plus(payout),
      })
    }

    const netAmount = totalReceived.minus(totalHouseCommission).minus(totalAgentCommission)
    const profit = netAmount.minus(totalPayout)

    return {
      roundId,
      totalReceived: totalReceived.toFixed(2),
      totalPayout: totalPayout.toFixed(2),
      totalHouseCommission: totalHouseCommission.toFixed(2),
      totalAgentCommission: totalAgentCommission.toFixed(2),
      netAmount: netAmount.toFixed(2),
      profit: profit.toFixed(2),
      byLotteryType: [...byLotteryTypeMap.values()].map((v) => ({
        code: v.code,
        name: v.name,
        received: v.received.toFixed(2),
        payout: v.payout.toFixed(2),
        houseCommission: v.houseCommission.toFixed(2),
        agentCommission: v.agentCommission.toFixed(2),
        netAmount: v.received.minus(v.houseCommission).minus(v.agentCommission).toFixed(2),
        profit: v.received.minus(v.houseCommission).minus(v.agentCommission).minus(v.payout).toFixed(2),
      })),
      byBetType: [...byBetTypeMap.entries()].map(([betType, v]) => ({
        betType,
        received: v.received.toFixed(2),
        payout: v.payout.toFixed(2),
      })),
    }
  }

  async getSummaryByRoundPerHouse(roundId: string) {
    const rows = await this.betItemsRepo
      .createQueryBuilder('bi')
      .innerJoin('bi.bet', 'b')
      .where('b.round_id = :roundId', { roundId })
      .andWhere('b.status != :cancelled', { cancelled: BetStatus.CANCELLED })
      .andWhere('b.deleted_at IS NULL')
      .select([
        'b.house_id as house_id',
        'SUM(bi.amount) as received',
        'SUM(bi.commission_amount) as house_commission',
        'SUM(bi.agent_commission_amount) as agent_commission',
      ])
      .groupBy('b.house_id')
      .getRawMany<{ house_id: string; received: string; house_commission: string; agent_commission: string }>()

    const houses = await this.housesRepo.find()
    const houseMap = new Map(houses.map((h) => [h.id, h.name]))

    return rows.map((row) => ({
      houseId: row.house_id,
      houseName: row.house_id ? (houseMap.get(row.house_id) ?? 'ไม่ระบุ') : 'ไม่ระบุ',
      received: new Decimal(row.received ?? 0).toFixed(2),
      houseCommission: new Decimal(row.house_commission ?? 0).toFixed(2),
      agentCommission: new Decimal(row.agent_commission ?? 0).toFixed(2),
      netAmount: new Decimal(row.received ?? 0)
        .minus(row.house_commission ?? 0)
        .minus(row.agent_commission ?? 0)
        .toFixed(2),
    }))
  }
}
