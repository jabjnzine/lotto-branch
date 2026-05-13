import { describe, it, expect } from 'vitest'
import { validateBetNumber } from '../validators/bet.validator'
import { BetType } from '../enums/bet-type.enum'

describe('validateBetNumber', () => {
  it('accepts correct digit count for each BetType', () => {
    expect(validateBetNumber('1234', BetType.FOUR_TOP)).toBe(true)
    expect(validateBetNumber('12345', BetType.FIVE_TOP)).toBe(true)
    expect(validateBetNumber('123', BetType.THREE_TOP)).toBe(true)
    expect(validateBetNumber('123', BetType.THREE_TOD)).toBe(true)
    expect(validateBetNumber('123', BetType.THREE_FRONT)).toBe(true)
    expect(validateBetNumber('123', BetType.THREE_BACK)).toBe(true)
    expect(validateBetNumber('12', BetType.TWO_TOP)).toBe(true)
    expect(validateBetNumber('12', BetType.TWO_BOTTOM)).toBe(true)
    expect(validateBetNumber('5', BetType.RUN_TOP)).toBe(true)
    expect(validateBetNumber('5', BetType.RUN_BOTTOM)).toBe(true)
  })

  it('accepts leading zeros', () => {
    expect(validateBetNumber('012', BetType.THREE_TOP)).toBe(true)
    expect(validateBetNumber('05', BetType.TWO_BOTTOM)).toBe(true)
    expect(validateBetNumber('0', BetType.RUN_TOP)).toBe(true)
  })

  it('rejects wrong digit count', () => {
    expect(validateBetNumber('12', BetType.THREE_TOP)).toBe(false)
    expect(validateBetNumber('1234', BetType.TWO_TOP)).toBe(false)
    expect(validateBetNumber('12', BetType.RUN_TOP)).toBe(false)
    expect(validateBetNumber('', BetType.TWO_BOTTOM)).toBe(false)
  })

  it('rejects non-numeric characters', () => {
    expect(validateBetNumber('abc', BetType.THREE_TOP)).toBe(false)
    expect(validateBetNumber('12a', BetType.THREE_TOP)).toBe(false)
    expect(validateBetNumber('1 2', BetType.TWO_TOP)).toBe(false)
  })
})
