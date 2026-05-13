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

interface LaoLottoData {
  drawDate: string
  firstPrize: string     // เลขท้าย 4 ตัว
  threeTop: string       // เลขท้าย 3 ตัว (last 3 digits of firstPrize)
  twoLast: string        // เลขท้าย 2 ตัว (last 2 digits of firstPrize)
  patthanaNumbers: string[]  // หวยลาวพัฒนา — 5 ตัวเลข 2 หลัก
}

@Injectable()
export class LaoLottoFetcherService {
  private readonly logger = new Logger(LaoLottoFetcherService.name)

  constructor(
    @InjectRepository(LotteryRound) private readonly roundsRepo: Repository<LotteryRound>,
    @InjectRepository(LotteryResult) private readonly resultsRepo: Repository<LotteryResult>,
    private readonly betsService: BetsService,
  ) {}

  /** Cron: ทุกวัน หลัง 20:00 น. (เช็คทุก 5 นาที ถึง 23:00) */
  @Cron('*/5 20-22 * * *', { timeZone: 'Asia/Bangkok' })
  async autoFetchDaily() {
    this.logger.log('Cron: ตรวจสอบผลหวยลาว...')
    await this.fetchLatestAndSave()
  }

  /** Fallback: เช้ามืดวันถัดไป 6:00-8:00 น. ดักผลที่มาช้ากว่ากำหนด */
  @Cron('*/10 6-8 * * *', { timeZone: 'Asia/Bangkok' })
  async catchLateLaoResults() {
    this.logger.log('Cron: ดักผลหวยลาวที่มาช้า...')
    await this.fetchLatestAndSave()
  }

  async fetchLatestAndSave(): Promise<{ message: string; roundId?: string }> {
    this.logger.log('กำลังตรวจสอบผลหวยลาว...')

    const today = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD')

    // เช็ค DB ก่อน — ถ้ามีผลแล้ว ไม่ต้อง scrape
    const existingResults = await this.resultsRepo
      .createQueryBuilder('res')
      .innerJoin('res.round', 'r')
      .innerJoin('r.lottery_type', 'lt')
      .where('lt.code IN (:...codes)', { codes: ['LAO', 'LAO_PATTHANA'] })
      .andWhere('r.draw_date = :drawDate', { drawDate: today })
      .andWhere('res.is_official = true')
      .getCount()

    if (existingResults > 0) {
      this.logger.log(`ผลหวยลาววันที่ ${today} มีในระบบแล้ว ข้าม`)
      return { message: `ผลหวยลาววันที่ ${today} มีในระบบแล้ว` }
    }

    const now = dayjs().tz('Asia/Bangkok')
    const buddhistYear = now.year() + 543
    const url = `https://www.sanook.com/news/laolotto/${now.format('DDMM')}${buddhistYear}/`

    let lottoData: LaoLottoData
    try {
      lottoData = await this.scrapeUrl(url)
    } catch (err) {
      this.logger.error('ดึงผลหวยลาวล้มเหลว', err)
      return { message: 'ไม่สามารถดึงผลหวยลาวจาก sanook.com ได้' }
    }

    if (!lottoData.firstPrize) {
      return { message: 'ยังไม่มีผลหวยลาวล่าสุด' }
    }

    const results: { message: string; roundId?: string }[] = []

    // บันทึกผล LAO
    const laoResult = await this.saveResult('LAO', lottoData.drawDate, {
      first_prize: lottoData.firstPrize,
      two_last: lottoData.twoLast,
    })
    results.push(laoResult)

    // บันทึกผล LAO_PATTHANA (ถ้ามี)
    if (lottoData.patthanaNumbers.length === 5) {
      const patthanaResult = await this.saveResult('LAO_PATTHANA', lottoData.drawDate, {
        three_front: lottoData.patthanaNumbers,
      })
      results.push(patthanaResult)
    }

    return {
      message: results.map((r) => r.message).join(' | '),
      roundId: results.find((r) => r.roundId)?.roundId,
    }
  }

  private async saveResult(
    typeCode: string,
    drawDate: string,
    data: { first_prize?: string; two_last?: string; three_front?: string[] },
  ) {
    const round = await this.roundsRepo
      .createQueryBuilder('r')
      .innerJoin('r.lottery_type', 'lt')
      .where('lt.code = :code', { code: typeCode })
      .andWhere('r.draw_date = :drawDate', { drawDate })
      .getOne()

    if (!round) {
      return { message: `ไม่พบงวด ${typeCode} วันที่ ${drawDate}` }
    }

    const existing = await this.resultsRepo.findOne({ where: { round_id: round.id } })
    if (existing?.is_official) {
      return { message: `งวด ${typeCode} ${drawDate} มีผลแล้ว`, roundId: round.id }
    }

    const resultData: Partial<LotteryResult> = {
      round_id: round.id,
      first_prize: data.first_prize ?? null,
      two_last: data.two_last ?? null,
      three_front: data.three_front ?? undefined,
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
      this.logger.error(`คำนวณถูก-ผิดล้มเหลว (${typeCode}):`, err)
    })

    this.logger.log(`บันทึกผล ${typeCode} งวด ${drawDate} สำเร็จ`)
    return { message: `ดึงผล ${typeCode} งวด ${drawDate} สำเร็จ`, roundId: round.id }
  }

  async scrapeUrl(url: string): Promise<LaoLottoData> {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LottoBot/1.0)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

    const html = await res.text()
    const $ = load(html)

    // ดึงวันที่จาก <title> — "ตรวจหวยลาว 11 พฤษภาคม 2569"
    const title = $('title').text()
    const dateMatch = title.match(/(\d{1,2}\s+(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s+\d{4})/)
    if (!dateMatch) throw new Error('ไม่พบวันที่ใน title')
    const drawDate = this.parseThaiDate(dateMatch[1])

    // วนทุก h2/h3.tag-dummy เพื่อหาเลขตาม label
    let firstPrize = ''
    let threeTop = ''
    let twoLast = ''
    const patthanaNumbers: string[] = []

    $('.tag-dummy').each((_, el) => {
      const $el = $(el)
      const tag = el.tagName?.toLowerCase() ?? ''
      const text = $el.text().trim()

      if (tag === 'h2' && text === 'เลขท้าย 4 ตัว') {
        // h2 → parent (th) → next sibling (td) → strong
        const raw = $el.parent().next().find('strong').first().text().trim()
        if (/^\d{4}$/.test(raw)) firstPrize = raw
        return
      }

      if (tag === 'h3' && text === 'เลขท้าย 3 ตัว') {
        // h3 → next sibling คือ strong
        const raw = $el.next('strong').text().trim()
        if (/^\d{3}$/.test(raw)) threeTop = raw
        return
      }

      if (tag === 'h3' && text === 'เลขท้าย 2 ตัว') {
        const raw = $el.next('strong').text().trim()
        if (/^\d{2}$/.test(raw)) twoLast = raw
        return
      }

      if (tag === 'h2' && text === 'หวยลาวพัฒนา') {
        // h2 → parent (th) → next sibling (tdFull) → strong × 5
        $el.parent().next().find('strong').each((_, strong) => {
          const n = $(strong).text().trim()
          if (/^\d{2}$/.test(n)) patthanaNumbers.push(n)
        })
      }
    })

    // Fallback: derive from firstPrize if not found on page
    if (!threeTop && firstPrize.length === 4) {
      threeTop = firstPrize.slice(-3)
    }
    if (!twoLast && firstPrize.length === 4) {
      twoLast = firstPrize.slice(-2)
    }

    return { drawDate, firstPrize, threeTop, twoLast, patthanaNumbers }
  }

  private parseThaiDate(thaiDate: string): string {
    const months: Record<string, number> = {
      มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
      พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
      กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
    }
    const parts = thaiDate.split(' ')
    if (parts.length !== 3) return ''

    const day = parseInt(parts[0], 10)
    const month = months[parts[1]]
    const buddhistYear = parseInt(parts[2], 10)
    const gregorianYear = buddhistYear - 543

    if (!month || isNaN(day) || isNaN(gregorianYear)) return ''

    return dayjs(`${gregorianYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).format('YYYY-MM-DD')
  }
}
