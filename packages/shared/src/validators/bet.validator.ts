import { BetType, BET_TYPE_DIGIT_COUNT } from '../enums/bet-type.enum'

export function validateBetNumber(number: string, betType: BetType): boolean {
  const digits = BET_TYPE_DIGIT_COUNT[betType]
  return /^\d+$/.test(number) && number.length === digits
}
