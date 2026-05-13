import { describe, it, expect } from 'vitest'
import { groupBetTypesForUi, BetType } from '../enums/bet-type.enum'

describe('groupBetTypesForUi', () => {
  it('TH type produces three_digit, two_digit, run groups', () => {
    const allowed = [
      BetType.THREE_TOP, BetType.THREE_TOD, BetType.THREE_FRONT, BetType.THREE_BACK,
      BetType.TWO_TOP, BetType.TWO_BOTTOM,
      BetType.RUN_TOP, BetType.RUN_BOTTOM,
    ]
    const groups = groupBetTypesForUi(allowed)
    expect(groups).toHaveLength(3)
    expect(groups[0].groupId).toBe('three_digit')
    expect(groups[0].betTypes).toEqual([BetType.THREE_TOP, BetType.THREE_TOD, BetType.THREE_FRONT, BetType.THREE_BACK])
    expect(groups[1].groupId).toBe('two_digit')
    expect(groups[2].groupId).toBe('run')
  })

  it('LAO type produces four_digit, three_digit, two_digit, run groups', () => {
    const allowed = [
      BetType.FOUR_TOP,
      BetType.THREE_TOP, BetType.THREE_TOD,
      BetType.TWO_TOP, BetType.TWO_BOTTOM,
      BetType.RUN_TOP, BetType.RUN_BOTTOM,
    ]
    const groups = groupBetTypesForUi(allowed)
    expect(groups).toHaveLength(4)
    expect(groups[0].groupId).toBe('four_digit')
    expect(groups[0].betTypes).toEqual([BetType.FOUR_TOP])
    expect(groups[1].groupId).toBe('three_digit')
    expect(groups[2].groupId).toBe('two_digit')
    expect(groups[3].groupId).toBe('run')
  })

  it('LAO_PATTHANA produces only two_digit and run groups', () => {
    const allowed = [
      BetType.TWO_TOP, BetType.TWO_BOTTOM,
      BetType.RUN_TOP, BetType.RUN_BOTTOM,
    ]
    const groups = groupBetTypesForUi(allowed)
    expect(groups).toHaveLength(2)
    expect(groups[0].groupId).toBe('two_digit')
    expect(groups[1].groupId).toBe('run')
  })

  it('follows GROUP_ORDER (four → three → five → two → run)', () => {
    // mix order to verify sorting
    const allowed = [
      BetType.RUN_TOP, BetType.TWO_TOP, BetType.THREE_TOP, BetType.FOUR_TOP,
    ]
    const groups = groupBetTypesForUi(allowed)
    expect(groups).toHaveLength(4)
    expect(groups[0].groupId).toBe('four_digit')
    expect(groups[1].groupId).toBe('three_digit')
    expect(groups[2].groupId).toBe('two_digit')
    expect(groups[3].groupId).toBe('run')
  })

  it('returns empty array for empty input', () => {
    expect(groupBetTypesForUi([])).toEqual([])
  })
})
