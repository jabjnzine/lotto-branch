import { BetType, ResultStructure } from '@lotto/shared'

export interface WinningDigits {
  topDigits: string
  bottomDigits: string
}

export function getWinningDigits(
  structure: ResultStructure,
  result: {
    first_prize?: string | null
    two_last?: string | null
    three_front?: string[] | null
  },
): WinningDigits {
  switch (structure) {
    case ResultStructure.THAI_FULL:
    case ResultStructure.LAO_FULL:
      return { topDigits: result.first_prize ?? '', bottomDigits: result.two_last ?? '' }
    case ResultStructure.LAO_5_2: {
      const nums = (Array.isArray(result.three_front) ? result.three_front : []) as string[]
      const joined = nums.join('')
      return { topDigits: joined, bottomDigits: joined }
    }
    default:
      return { topDigits: '', bottomDigits: '' }
  }
}

export interface MatchContext {
  topDigits: string
  bottomDigits: string
  frontSet: Set<string>
  backSet: Set<string>
  patthanaSet: Set<string>
  structure: ResultStructure
}

export function isMatch(number: string, betType: BetType, ctx: MatchContext): boolean {
  switch (betType) {
    case BetType.FOUR_TOP:
    case BetType.FIVE_TOP:
      return number === ctx.topDigits

    case BetType.THREE_TOP:
      return ctx.topDigits.length >= 3 && ctx.topDigits.slice(-3) === number

    case BetType.THREE_TOD: {
      if (ctx.topDigits.length < 3) return false
      const target = ctx.topDigits.slice(-3)
      if (target === number) return true
      const perms = new Set<string>()
      const arr = target.split('')
      const permute = (a: string[], l: number) => {
        if (l === a.length - 1) { perms.add(a.join('')); return }
        for (let i = l; i < a.length; i++) {
          [a[l], a[i]] = [a[i], a[l]]
          permute([...a], l + 1)
        }
      }
      permute(arr, 0)
      return perms.has(number)
    }

    case BetType.THREE_FRONT:
      return ctx.frontSet.has(number)

    case BetType.THREE_BACK:
      return ctx.backSet.has(number)

    case BetType.TWO_TOP:
      if (ctx.structure === ResultStructure.LAO_5_2) return ctx.patthanaSet.has(number)
      return ctx.topDigits.length >= 2 && ctx.topDigits.slice(-2) === number

    case BetType.TWO_BOTTOM:
      if (ctx.structure === ResultStructure.LAO_5_2) return ctx.patthanaSet.has(number)
      return ctx.bottomDigits === number

    case BetType.RUN_TOP:
      return ctx.topDigits.includes(number)

    case BetType.RUN_BOTTOM:
      return ctx.bottomDigits.includes(number)

    default:
      return false
  }
}
