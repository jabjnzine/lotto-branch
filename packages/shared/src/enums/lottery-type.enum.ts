export enum DrawScheduleType {
  MONTHLY_DATES = 'monthly_dates',
  WEEKDAYS = 'weekdays',
  DAILY = 'daily',
}

export enum ResultStructure {
  THAI_FULL = 'thai_full',
  LAO_5DIGIT = 'lao_5digit',
  LAO_3_2 = 'lao_3_2',
}

export enum RestrictionType {
  CLOSED = 'closed',
  LIMITED = 'limited',
  HALF_PAY = 'half_pay',
}

export enum RoundStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  RESULTED = 'resulted',
  CANCELLED = 'cancelled',
}

export enum BetStatus {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export enum ResultSource {
  API = 'api',
  MANUAL = 'manual',
}
