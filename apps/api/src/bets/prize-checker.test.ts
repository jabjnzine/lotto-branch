import { describe, it, expect } from 'vitest'
import { getWinningDigits, isMatch, type MatchContext } from './prize-checker'
import { BetType, ResultStructure } from '@lotto/shared'

function ctx(overrides: Partial<MatchContext> = {}): MatchContext {
  return {
    topDigits: '',
    bottomDigits: '',
    frontSet: new Set(),
    backSet: new Set(),
    patthanaSet: new Set(),
    structure: ResultStructure.THAI_FULL,
    ...overrides,
  }
}

describe('getWinningDigits', () => {
  it('THAI_FULL: topDigits = first_prize, bottomDigits = two_last', () => {
    const result = getWinningDigits(ResultStructure.THAI_FULL, {
      first_prize: '123456',
      two_last: '88',
    })
    expect(result.topDigits).toBe('123456')
    expect(result.bottomDigits).toBe('88')
  })

  it('LAO_FULL: topDigits = first_prize, bottomDigits = two_last', () => {
    const result = getWinningDigits(ResultStructure.LAO_FULL, {
      first_prize: '5678',
      two_last: '90',
    })
    expect(result.topDigits).toBe('5678')
    expect(result.bottomDigits).toBe('90')
  })

  it('LAO_5_2: both topDigits and bottomDigits = joined three_front', () => {
    const result = getWinningDigits(ResultStructure.LAO_5_2, {
      three_front: ['12', '34', '56', '78', '90'],
    })
    expect(result.topDigits).toBe('1234567890')
    expect(result.bottomDigits).toBe('1234567890')
  })

  it('returns empty strings for null/missing values', () => {
    const result = getWinningDigits(ResultStructure.THAI_FULL, {})
    expect(result.topDigits).toBe('')
    expect(result.bottomDigits).toBe('')
  })

  it('returns empty strings for unknown structure', () => {
    const result = getWinningDigits('unknown' as ResultStructure, {
      first_prize: '123456',
    })
    expect(result.topDigits).toBe('')
    expect(result.bottomDigits).toBe('')
  })
})

describe('isMatch', () => {
  describe('THAI_FULL structure', () => {
    // first_prize='789123', two_last='88'
    // threeTop = last 3 of first_prize = '123'
    const c = ctx({
      topDigits: '789123',
      bottomDigits: '88',
      frontSet: new Set(['267', '318']),
      backSet: new Set(['065', '153']),
      structure: ResultStructure.THAI_FULL,
    })

    it('3_top: matches last 3 of topDigits', () => {
      expect(isMatch('123', BetType.THREE_TOP, c)).toBe(true)
    })

    it('3_top: no match', () => {
      expect(isMatch('999', BetType.THREE_TOP, c)).toBe(false)
    })

    it('3_tod: matches permutation', () => {
      expect(isMatch('132', BetType.THREE_TOD, c)).toBe(true)
      expect(isMatch('321', BetType.THREE_TOD, c)).toBe(true)
    })

    it('3_tod: exact match also passes', () => {
      expect(isMatch('123', BetType.THREE_TOD, c)).toBe(true)
    })

    it('3_tod: no match', () => {
      expect(isMatch('000', BetType.THREE_TOD, c)).toBe(false)
    })

    it('3_front: matches one in frontSet', () => {
      expect(isMatch('267', BetType.THREE_FRONT, c)).toBe(true)
    })

    it('3_front: not in set', () => {
      expect(isMatch('000', BetType.THREE_FRONT, c)).toBe(false)
    })

    it('3_back: matches one in backSet', () => {
      expect(isMatch('065', BetType.THREE_BACK, c)).toBe(true)
      expect(isMatch('153', BetType.THREE_BACK, c)).toBe(true)
    })

    it('2_top: matches last 2 of topDigits', () => {
      expect(isMatch('23', BetType.TWO_TOP, c)).toBe(true)
    })

    it('2_top: no match', () => {
      expect(isMatch('99', BetType.TWO_TOP, c)).toBe(false)
    })

    it('2_bottom: matches bottomDigits exactly', () => {
      expect(isMatch('88', BetType.TWO_BOTTOM, c)).toBe(true)
    })

    it('2_bottom: no match', () => {
      expect(isMatch('99', BetType.TWO_BOTTOM, c)).toBe(false)
    })

    it('run_top: digit found in topDigits', () => {
      expect(isMatch('9', BetType.RUN_TOP, c)).toBe(true)
      expect(isMatch('1', BetType.RUN_TOP, c)).toBe(true)
    })

    it('run_top: digit not found', () => {
      expect(isMatch('0', BetType.RUN_TOP, c)).toBe(false)
    })

    it('run_bottom: digit found in bottomDigits', () => {
      expect(isMatch('8', BetType.RUN_BOTTOM, c)).toBe(true)
    })

    it('run_bottom: digit not found', () => {
      expect(isMatch('0', BetType.RUN_BOTTOM, c)).toBe(false)
    })
  })

  describe('LAO_FULL (4-digit first_prize)', () => {
    const c = ctx({
      topDigits: '5678',
      bottomDigits: '90',
      structure: ResultStructure.LAO_FULL,
    })

    it('4_top: matches full topDigits', () => {
      expect(isMatch('5678', BetType.FOUR_TOP, c)).toBe(true)
    })

    it('4_top: no match', () => {
      expect(isMatch('1234', BetType.FOUR_TOP, c)).toBe(false)
    })

    it('3_top: matches last 3 of topDigits', () => {
      expect(isMatch('678', BetType.THREE_TOP, c)).toBe(true)
    })

    it('2_top: matches last 2 of topDigits', () => {
      expect(isMatch('78', BetType.TWO_TOP, c)).toBe(true)
    })

    it('run_bottom: digit in bottomDigits', () => {
      expect(isMatch('9', BetType.RUN_BOTTOM, c)).toBe(true)
      expect(isMatch('0', BetType.RUN_BOTTOM, c)).toBe(true)
    })
  })

  describe('LAO_5_2 (patthana set)', () => {
    const c = ctx({
      topDigits: '1234567890',
      bottomDigits: '1234567890',
      frontSet: new Set(['12', '34', '56', '78', '90']),
      patthanaSet: new Set(['12', '34', '56', '78', '90']),
      structure: ResultStructure.LAO_5_2,
    })

    it('2_top: matches patthanaSet (not last 2 of topDigits)', () => {
      // Without LAO_5_2, last 2 of topDigits '1234567890' would be '90'
      // But with LAO_5_2, it checks patthanaSet
      expect(isMatch('12', BetType.TWO_TOP, c)).toBe(true)
      expect(isMatch('56', BetType.TWO_TOP, c)).toBe(true)
    })

    it('2_bottom: matches patthanaSet', () => {
      expect(isMatch('78', BetType.TWO_BOTTOM, c)).toBe(true)
      expect(isMatch('90', BetType.TWO_BOTTOM, c)).toBe(true)
    })

    it('2_top: not in patthanaSet', () => {
      expect(isMatch('99', BetType.TWO_TOP, c)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('empty topDigits rejects 3_top', () => {
      const c = ctx({ topDigits: '' })
      expect(isMatch('123', BetType.THREE_TOP, c)).toBe(false)
    })

    it('empty topDigits rejects 3_tod', () => {
      const c = ctx({ topDigits: '' })
      expect(isMatch('123', BetType.THREE_TOD, c)).toBe(false)
    })

    it('empty topDigits rejects 2_top', () => {
      const c = ctx({ topDigits: '' })
      expect(isMatch('12', BetType.TWO_TOP, c)).toBe(false)
    })

    it('FIVE_TOP behaves same as FOUR_TOP (matches full topDigits)', () => {
      const c = ctx({ topDigits: '12345' })
      expect(isMatch('12345', BetType.FIVE_TOP, c)).toBe(true)
      expect(isMatch('1234', BetType.FIVE_TOP, c)).toBe(false)
    })
  })
})
