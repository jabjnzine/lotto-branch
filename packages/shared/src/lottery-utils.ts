import Decimal from 'decimal.js'

// สร้าง permutation ของตัวเลข เช่น "123" → ["132", "213", "231", "312", "321"]
export function permute(num: string): string[] {
  const digits = num.split('')
  const results = new Set<string>()

  function generate(arr: string[], current: string) {
    if (current.length === arr.length + current.length) return
    if (arr.length === 0) {
      results.add(current)
      return
    }
    for (let i = 0; i < arr.length; i++) {
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)]
      generate(remaining, current + arr[i])
    }
  }

  const permArr: string[] = []
  function permHelper(input: string[], memo: string[] = []) {
    if (input.length === 0) {
      permArr.push(memo.join(''))
      return
    }
    for (let i = 0; i < input.length; i++) {
      const curr = input.splice(i, 1)
      permHelper(input, [...memo, curr[0]])
      input.splice(i, 0, curr[0])
    }
  }

  permHelper(digits)
  // ไม่รวมเลขเดิม
  return permArr.filter((p) => p !== num)
}

// รูด: สร้างชุดเลข 2 ตัวที่มีตัวเลขนั้นเป็นส่วนหนึ่ง
// pos = 'front' หมายถึงตัวหน้า เช่น รูด 5 บน = 50,51,52,...,59
// pos = 'back' หมายถึงตัวหลัง เช่น รูด 5 ล่าง = 05,15,25,...,95
export function rude(digit: string, pos: 'front' | 'back'): string[] {
  const results: string[] = []
  for (let i = 0; i <= 9; i++) {
    if (pos === 'front') {
      results.push(`${digit}${i}`)
    } else {
      results.push(`${i}${digit}`)
    }
  }
  return results
}

// 19 ประตู: เลข 2 ตัวที่มีผลรวม = ตัวเลขที่กำหนด (mod 10) หรือ sum เท่ากัน
export function nineteenGates(digit: string): string[] {
  const target = parseInt(digit, 10)
  const results: string[] = []
  for (let i = 0; i <= 9; i++) {
    for (let j = 0; j <= 9; j++) {
      if ((i + j) % 10 === target % 10) {
        results.push(`${i}${j}`)
      }
    }
  }
  return [...new Set(results)]
}

export interface LotteryResult {
  first_prize?: string | null
  three_top?: string | null
  three_front?: string[] | null
  three_back?: string[] | null
  two_last?: string | null
}

export interface BetItem {
  number: string
  bet_type: string
  amount: string | number
  payout_rate: string | number
}

export interface PayoutSummary {
  items: Array<{
    number: string
    bet_type: string
    amount: string
    payout_rate: string
    win_amount: string
    is_winner: boolean
  }>
  total_win: string
}

// derive 3 ตัวบน จาก result
export function getThreeTop(result: LotteryResult): string | null {
  if (result.three_top) return result.three_top
  if (result.first_prize) return result.first_prize.slice(-3)
  return null
}

// ตรวจรางวัล + คำนวณยอดจ่าย
export function checkPrize(result: LotteryResult, bets: BetItem[]): PayoutSummary {
  const threeTop = getThreeTop(result)
  const twoLast = result.two_last
  const threeFront = result.three_front ?? []
  const threeBack = result.three_back ?? []
  const firstPrize = result.first_prize

  let totalWin = new Decimal(0)

  const items = bets.map((bet) => {
    let isWinner = false

    switch (bet.bet_type) {
      case '5_top':
        isWinner = !!firstPrize && firstPrize === bet.number
        break
      case '3_top':
        isWinner = !!threeTop && threeTop === bet.number
        break
      case '3_tod':
        isWinner = !!threeTop && permute(bet.number).concat([bet.number]).includes(threeTop)
        break
      case '3_front':
        isWinner = threeFront.includes(bet.number)
        break
      case '3_back':
        isWinner = threeBack.includes(bet.number)
        break
      case '2_top':
        if (firstPrize) {
          isWinner = firstPrize.slice(-2) === bet.number
        }
        break
      case '2_bottom':
        isWinner = !!twoLast && twoLast === bet.number
        break
      case 'run_top':
        isWinner = !!threeTop && threeTop.includes(bet.number)
        break
      case 'run_bottom':
        isWinner = !!twoLast && twoLast.includes(bet.number)
        break
    }

    const amount = new Decimal(bet.amount)
    const rate = new Decimal(bet.payout_rate)
    const winAmount = isWinner ? amount.mul(rate) : new Decimal(0)
    totalWin = totalWin.plus(winAmount)

    return {
      number: bet.number,
      bet_type: bet.bet_type,
      amount: amount.toFixed(2),
      payout_rate: rate.toFixed(2),
      win_amount: winAmount.toFixed(2),
      is_winner: isWinner,
    }
  })

  return {
    items,
    total_win: totalWin.toFixed(2),
  }
}
