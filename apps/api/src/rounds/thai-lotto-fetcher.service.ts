import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron } from '@nestjs/schedule'
import { Repository } from 'typeorm'
import { load } from 'cheerio'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { LotteryRound } from '../entities/lottery-round.entity'
import { LotteryResult } from '../entities/lottery-result.entity'
import { RoundStatus, ResultSource } from '@lotto/shared'
import { BetsService } from '../bets/bets.service'

dayjs.extend(utc)
dayjs.extend(timezone)

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
}

interface LottoData {
  drawDate: string   // YYYY-MM-DD
  firstPrize: string
  threeFront: string[]
  threeBack: string[]
  twoLast: string
}

@Injectable()
export class ThaiLottoFetcherService {
  private readonly logger = new Logger(ThaiLottoFetcherService.name)

  constructor(
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
    @InjectRepository(LotteryResult) private readonly resultsRepo: Repository<LotteryResult>,
    private readonly betsService: BetsService,
  ) {}

  /** Cron: ทุกวันที่ 1 และ 16 ของเดือน เวลา 15:00–22:00 น. (เช็คทุก 5 นาที) */
  @Cron('*/5 15-21 1,16 * *', { timeZone: 'Asia/Bangkok' })
  async autoFetchOnDrawDays() {
    this.logger.log('Cron: ตรวจสอบผลหวยวันหวยออก...')
    await this.fetchLatestAndSave()
  }

  /** Fallback: เช้าวันถัดไป (วันที่ 2, 17) เวลา 6:00-8:00 น. ดักผลที่มาช้า */
  @Cron('*/10 6-8 2,17 * *', { timeZone: 'Asia/Bangkok' })
  async catchLateThaiResults() {
    this.logger.log('Cron: ดักผลหวยรัฐบาลที่มาช้า...')
    await this.fetchLatestAndSave()
  }

  async fetchLatestAndSave(): Promise<{ message: string; roundId?: string }> {
    this.logger.log('กำลังตรวจสอบผลหวยรัฐบาล...')

    const today = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD')

    // เช็ค DB ก่อน — ถ้ามีผลแล้ว ไม่ต้อง scrape
    const hasOfficial = await this.resultsRepo
      .createQueryBuilder('res')
      .innerJoin('res.round', 'r')
      .innerJoin('r.lottery_type', 'lt')
      .where('lt.code = :code', { code: 'TH' })
      .andWhere('r.draw_date = :drawDate', { drawDate: today })
      .andWhere('res.is_official = true')
      .getCount()

    if (hasOfficial > 0) {
      this.logger.log(`ผลหวยรัฐบาลวันที่ ${today} มีในระบบแล้ว ข้าม`)
      return { message: `ผลหวยรัฐบาลวันที่ ${today} มีในระบบแล้ว` }
    }

    const now = dayjs().tz('Asia/Bangkok')
    const buddhistYear = now.year() + 543
    const url = `https://news.sanook.com/lotto/check/${now.format('DDMM')}${buddhistYear}/`

    let lottoData: LottoData
    try {
      lottoData = await this.scrapeUrl(url)
    } catch (err) {
      this.logger.error('ดึงผลหวยล้มเหลว', err)
      return { message: 'ไม่สามารถดึงผลหวยจาก sanook.com ได้' }
    }

    if (!lottoData.firstPrize) {
      return { message: 'ยังไม่มีผลหวยล่าสุด' }
    }

    const round = await this.roundsRepo
      .createQueryBuilder('r')
      .innerJoin('r.lottery_type', 'lt')
      .where('lt.code = :code', { code: 'TH' })
      .andWhere('r.draw_date = :drawDate', { drawDate: lottoData.drawDate })
      .getOne()

    if (!round) {
      return { message: `ไม่พบงวด THAI วันที่ ${lottoData.drawDate}` }
    }

    const existing = await this.resultsRepo.findOne({ where: { round_id: round.id } })
    if (existing?.is_official) {
      return { message: `งวด ${lottoData.drawDate} มีผลแล้ว`, roundId: round.id }
    }

    const resultData: Partial<LotteryResult> = {
      round_id: round.id,
      first_prize: lottoData.firstPrize,
      three_front: lottoData.threeFront,
      three_back: lottoData.threeBack,
      two_last: lottoData.twoLast,
      source: ResultSource.API,
      is_official: true,
    }

    if (existing) {
      Object.assign(existing, resultData)
      await this.resultsRepo.save(existing)
    } else {
      const result = this.resultsRepo.create(resultData)
      await this.resultsRepo.save(result)
    }

    round.status = RoundStatus.RESULTED
    await this.roundsRepo.save(round)

    this.betsService.calculateWinners(round.id).catch((err) => {
      this.logger.error('คำนวณถูก-ผิดล้มเหลว:', err)
    })

    this.logger.log(`บันทึกผลหวยรัฐบาลงวด ${lottoData.drawDate} สำเร็จ`)
    return {
      message: `ดึงผลหวยรัฐบาลงวด ${lottoData.drawDate} สำเร็จ`,
      roundId: round.id,
    }
  }

  async scrapeUrl(url: string): Promise<LottoData> {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LottoBot/1.0)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    const html = await res.text()
    const $ = load(html)

    // ดึงวันที่จาก <title> — "ตรวจหวย ผลสลากกินแบ่งรัฐบาล งวดวันที่ 2 พฤษภาคม 2569"
    const title = $('title').text()
    const dateMatch = title.match(/(\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+\d{4})/)
    if (!dateMatch) throw new Error('ไม่พบวันที่ใน title')
    const drawDate = this.parseThaiDate(dateMatch[1])

    // รางวัลที่ 1 — <strong class="lotto__number lotto__number--first">
    const firstPrizeRaw = $('.lotto__number--first').first().text().trim()
    const firstPrize = /^\d{6}$/.test(firstPrizeRaw) ? firstPrizeRaw : ''

    // วนทุก .lottocheck__column หาเลขตาม label
    const threeFront: string[] = []
    const threeBack: string[] = []
    let twoLast = ''

    $('.lottocheck__column').each((_, col) => {
      const label = $(col).find('.default-font--reward').text().trim()

      if (label === 'เลขหน้า 3 ตัว') {
        $(col).find('.lotto__number').each((_, el) => {
          const n = $(el).text().trim()
          if (/^\d{3}$/.test(n)) threeFront.push(n)
        })
      }

      if (label === 'เลขท้าย 3 ตัว') {
        $(col).find('.lotto__number').each((_, el) => {
          const n = $(el).text().trim()
          if (/^\d{3}$/.test(n)) threeBack.push(n)
        })
      }

      if (label === 'เลขท้าย 2 ตัว') {
        const n = $(col).find('.lotto__number').first().text().trim()
        if (/^\d{2}$/.test(n)) twoLast = n
      }
    })

    
    return { drawDate, firstPrize, threeFront, threeBack, twoLast }
  }

  private parseThaiDate(thaiDate: string): string {
    // "2 พฤษภาคม 2569" → "2026-05-02"
    const parts = thaiDate.split(' ')
    if (parts.length !== 3) return ''

    const day = parseInt(parts[0], 10)
    const month = THAI_MONTHS[parts[1]]
    const buddhistYear = parseInt(parts[2], 10)
    const gregorianYear = buddhistYear - 543

    if (!month || isNaN(day) || isNaN(gregorianYear)) return ''

    return dayjs(`${gregorianYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD')
  }
}
