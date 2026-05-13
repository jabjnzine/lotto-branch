import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { LotteryType } from '../entities/lottery-type.entity'
import { LotteryRound } from '../entities/lottery-round.entity'
import { RoundStatus, DrawScheduleType } from '@lotto/shared'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

@Injectable()
export class RoundsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(RoundsSchedulerService.name)

  constructor(
    @InjectRepository(LotteryType) private readonly lotteryTypesRepo: Repository<LotteryType>,
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
  ) {}

  async onModuleInit() {
    this.logger.log('สร้างงวดเริ่มต้น...')
    await this.generateUpcomingRounds()
  }

  @Cron('0 0 * * *', { timeZone: 'Asia/Bangkok' })
  async generateUpcomingRounds() {
    this.logger.log('กำลังสร้างงวดล่วงหน้า 7 วัน...')
    const lotteryTypes = await this.lotteryTypesRepo.find({ where: { is_active: true } })

    for (const lt of lotteryTypes) {
      for (let i = 0; i < 7; i++) {
        const targetDate = dayjs().tz('Asia/Bangkok').add(i, 'day')

        if (!this.isDrawDay(lt, targetDate)) continue

        const drawDateStr = targetDate.format('YYYY-MM-DD')
        const existing = await this.roundsRepo.findOne({
          where: { lottery_type_id: lt.id, draw_date: drawDateStr },
        })
        if (existing) continue

        const drawTime = dayjs.tz(
          `${drawDateStr} ${lt.draw_time}`,
          'YYYY-MM-DD HH:mm',
          'Asia/Bangkok',
        )
        const closeAt = drawTime.subtract(lt.close_before_minutes, 'minute')
        const openAt = targetDate.startOf('day')

        await this.roundsRepo.save({
          lottery_type_id: lt.id,
          draw_date: drawDateStr,
          open_at: openAt.toDate(),
          close_at: closeAt.toDate(),
          status: RoundStatus.OPEN,
        })

        this.logger.log(`สร้างงวด ${lt.code} วันที่ ${drawDateStr}`)
      }
    }
  }

  private isDrawDay(lt: LotteryType, date: dayjs.Dayjs): boolean {
    switch (lt.draw_schedule_type) {
      case DrawScheduleType.DAILY:
        return true
      case DrawScheduleType.MONTHLY_DATES:
        return (lt.draw_days as number[]).includes(date.date())
      case DrawScheduleType.WEEKDAYS: {
        const dayMap: Record<number, string> = {
          0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
        }
        return (lt.draw_days as string[]).includes(dayMap[date.day()])
      }
      default:
        return false
    }
  }
}
