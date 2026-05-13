import { BetType } from '../enums/bet-type.enum'
import { RoundStatus, BetStatus, ResultSource, RestrictionType } from '../enums/lottery-type.enum'
import { UserRole } from '../enums/user-role.enum'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateBetItemDto {
  number: string
  bet_type: BetType
  amount: number
}

export interface CreateBetDto {
  round_id: string
  lottery_type_id: string
  buyer_name?: string
  note?: string
  items: CreateBetItemDto[]
}

export interface CreateRestrictionDto {
  number: string
  bet_type: BetType
  restriction_type: RestrictionType
  limit_amount?: number
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface IncomeSummaryByType {
  code: string
  name: string
  received: string
  payout: string
  profit: string
}

export interface IncomeSummaryByBetType {
  betType: string
  received: string
  payout: string
}

export interface IncomeSummaryResponse {
  roundId?: string
  totalReceived: string
  totalPayout: string
  profit: string
  byLotteryType: IncomeSummaryByType[]
  byBetType: IncomeSummaryByBetType[]
}
