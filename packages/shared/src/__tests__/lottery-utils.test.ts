import { describe, it, expect } from 'vitest'
import { getThreeTop, permute, rude, nineteenGates, checkPrize } from '../lottery-utils'
import { BetType } from '../enums/bet-type.enum'

describe('getThreeTop', () => {
  it('returns explicit three_top when provided', () => {
    expect(getThreeTop({ three_top: '456', first_prize: '123456' })).toBe('456')
  })

  it('falls back to first_prize last 3 digits', () => {
    expect(getThreeTop({ first_prize: '789123', three_top: null })).toBe('123')
  })

  it('returns null when neither is available', () => {
    expect(getThreeTop({})).toBeNull()
    expect(getThreeTop({ first_prize: null, three_top: null })).toBeNull()
  })
})

describe('permute', () => {
  it('generates permutations of 2-digit number excluding original', () => {
    const result = permute('12')
    expect(result).toHaveLength(1)
    expect(result).toContain('21')
    expect(result).not.toContain('12')
  })

  it('generates 5 permutations for 3-digit number', () => {
    const result = permute('123')
    expect(result).toHaveLength(5)
    expect(result).toEqual(expect.arrayContaining(['132', '213', '231', '312', '321']))
    expect(result).not.toContain('123')
  })

  it('returns empty for single digit', () => {
    expect(permute('5')).toEqual([])
  })
})

describe('rude', () => {
  it('generates front-digit combinations (digit in front)', () => {
    const result = rude('5', 'front')
    expect(result).toHaveLength(10)
    expect(result).toEqual(['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'])
  })

  it('generates back-digit combinations (digit at back)', () => {
    const result = rude('5', 'back')
    expect(result).toHaveLength(10)
    expect(result).toEqual(['05', '15', '25', '35', '45', '55', '65', '75', '85', '95'])
  })
})

describe('nineteenGates', () => {
  it('generates 10 combinations for a digit', () => {
    const result = nineteenGates('5')
    expect(result).toHaveLength(10)
    // All results should have sum % 10 = 5
    for (const num of result) {
      const sum = parseInt(num[0]) + parseInt(num[1])
      expect(sum % 10).toBe(5)
    }
  })

  it('works for digit 0', () => {
    const result = nineteenGates('0')
    expect(result).toHaveLength(10)
    for (const num of result) {
      const sum = parseInt(num[0]) + parseInt(num[1])
      expect(sum % 10).toBe(0)
    }
  })
})

describe('checkPrize', () => {
  const rate = '10'
  const bet = (number: string, bet_type: string) => ({
    number,
    bet_type,
    amount: '100',
    payout_rate: rate,
  })

  describe('THAI_FULL structure (first_prize + three_front + three_back + two_last)', () => {
    const result = {
      first_prize: '789123',
      three_front: ['267', '318'],
      three_back: ['065', '153'],
      two_last: '88',
    }

    it('3_top: matches last 3 of first_prize', () => {
      const { items } = checkPrize(result, [bet('123', BetType.THREE_TOP)])
      expect(items[0].is_winner).toBe(true)
      expect(items[0].win_amount).toBe('1000.00')
    })

    it('3_top: non-match', () => {
      const { items } = checkPrize(result, [bet('999', BetType.THREE_TOP)])
      expect(items[0].is_winner).toBe(false)
      expect(items[0].win_amount).toBe('0.00')
    })

    it('3_tod: matches permutation of last 3 digits', () => {
      const { items } = checkPrize(result, [bet('312', BetType.THREE_TOD)])
      expect(items[0].is_winner).toBe(true)
    })

    it('3_front: matches one of the front prizes', () => {
      const { items } = checkPrize(result, [bet('267', BetType.THREE_FRONT)])
      expect(items[0].is_winner).toBe(true)
    })

    it('3_back: matches one of the back prizes', () => {
      const { items } = checkPrize(result, [bet('065', BetType.THREE_BACK)])
      expect(items[0].is_winner).toBe(true)
    })

    it('2_top: matches last 2 of first_prize', () => {
      const { items } = checkPrize(result, [bet('23', BetType.TWO_TOP)])
      expect(items[0].is_winner).toBe(true)
    })

    it('2_bottom: matches two_last', () => {
      const { items } = checkPrize(result, [bet('88', BetType.TWO_BOTTOM)])
      expect(items[0].is_winner).toBe(true)
    })

    it('run_top: digit found anywhere in first_prize last 3', () => {
      const { items } = checkPrize(result, [bet('2', BetType.RUN_TOP)])
      expect(items[0].is_winner).toBe(true)
    })

    it('run_top: digit not in winning numbers', () => {
      const { items } = checkPrize(result, [bet('0', BetType.RUN_TOP)])
      expect(items[0].is_winner).toBe(false)
    })

    it('run_bottom: digit found in two_last', () => {
      const { items } = checkPrize(result, [bet('8', BetType.RUN_BOTTOM)])
      expect(items[0].is_winner).toBe(true)
    })
  })

  describe('LAO_FULL structure (4-digit first_prize)', () => {
    const result = {
      first_prize: '5678',
      two_last: '90',
    }

    it('4_top: matches full first_prize', () => {
      const { items } = checkPrize(result, [bet('5678', BetType.FOUR_TOP)])
      expect(items[0].is_winner).toBe(true)
    })

    it('4_top: non-match', () => {
      const { items } = checkPrize(result, [bet('1234', BetType.FOUR_TOP)])
      expect(items[0].is_winner).toBe(false)
    })

    it('3_top: derived from first_prize last 3', () => {
      const { items } = checkPrize(result, [bet('678', BetType.THREE_TOP)])
      expect(items[0].is_winner).toBe(true)
    })

    it('2_top: derived from first_prize last 2', () => {
      const { items } = checkPrize(result, [bet('78', BetType.TWO_TOP)])
      expect(items[0].is_winner).toBe(true)
    })

    it('2_bottom: from two_last', () => {
      const { items } = checkPrize(result, [bet('90', BetType.TWO_BOTTOM)])
      expect(items[0].is_winner).toBe(true)
    })

    it('run_top: digit found in derived three_top (last 3 of first_prize)', () => {
      const { items } = checkPrize(result, [bet('7', BetType.RUN_TOP)])
      expect(items[0].is_winner).toBe(true)
    })
  })

  describe('total_win calculation', () => {
    it('correctly sums multiple winning bets', () => {
      const result = {
        first_prize: '123456',
        three_front: [],
        three_back: [],
        two_last: '56',
      }
      const summary = checkPrize(result, [
        bet('456', BetType.THREE_TOP),
        bet('56', BetType.TWO_BOTTOM),
        bet('000', BetType.THREE_TOP),
      ])
      // 2 winners: 100*10 + 100*10 = 2000
      expect(summary.total_win).toBe('2000.00')
    })

    it('returns 0 total_win when no winners', () => {
      const result = {
        first_prize: '111111',
        three_front: [],
        three_back: [],
        two_last: '11',
      }
      const summary = checkPrize(result, [
        bet('999', BetType.THREE_TOP),
        bet('99', BetType.TWO_BOTTOM),
      ])
      expect(summary.total_win).toBe('0.00')
    })
  })
})
