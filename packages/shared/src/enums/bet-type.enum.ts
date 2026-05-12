export enum BetType {
  FIVE_TOP = '5_top',
  THREE_TOP = '3_top',
  THREE_TOD = '3_tod',
  THREE_FRONT = '3_front',
  THREE_BACK = '3_back',
  TWO_TOP = '2_top',
  TWO_BOTTOM = '2_bottom',
  RUN_TOP = 'run_top',
  RUN_BOTTOM = 'run_bottom',
}

export const BET_TYPE_LABEL: Record<BetType, string> = {
  [BetType.FIVE_TOP]: '5 ตัวบน',
  [BetType.THREE_TOP]: '3 ตัวบน',
  [BetType.THREE_TOD]: '3 ตัวโต้ด',
  [BetType.THREE_FRONT]: '3 ตัวหน้า',
  [BetType.THREE_BACK]: '3 ตัวท้าย',
  [BetType.TWO_TOP]: '2 ตัวบน',
  [BetType.TWO_BOTTOM]: '2 ตัวล่าง',
  [BetType.RUN_TOP]: 'วิ่งบน',
  [BetType.RUN_BOTTOM]: 'วิ่งล่าง',
}

export const BET_TYPE_DIGIT_COUNT: Record<BetType, number> = {
  [BetType.FIVE_TOP]: 5,
  [BetType.THREE_TOP]: 3,
  [BetType.THREE_TOD]: 3,
  [BetType.THREE_FRONT]: 3,
  [BetType.THREE_BACK]: 3,
  [BetType.TWO_TOP]: 2,
  [BetType.TWO_BOTTOM]: 2,
  [BetType.RUN_TOP]: 1,
  [BetType.RUN_BOTTOM]: 1,
}

export const LOTTERY_TYPE_BET_TYPES: Record<string, BetType[]> = {
  TH: [
    BetType.THREE_TOP,
    BetType.THREE_TOD,
    BetType.THREE_FRONT,
    BetType.THREE_BACK,
    BetType.TWO_TOP,
    BetType.TWO_BOTTOM,
    BetType.RUN_TOP,
    BetType.RUN_BOTTOM,
  ],
  LAO_PATTHANA: [
    BetType.THREE_TOP,
    BetType.THREE_TOD,
    BetType.THREE_FRONT,
    BetType.THREE_BACK,
    BetType.TWO_TOP,
    BetType.TWO_BOTTOM,
    BetType.RUN_TOP,
    BetType.RUN_BOTTOM,
  ],
  LAO_SUPER: [
    BetType.FIVE_TOP,
    BetType.TWO_TOP,
    BetType.TWO_BOTTOM,
    BetType.RUN_TOP,
    BetType.RUN_BOTTOM,
  ],
  LAO_STAR: [
    BetType.THREE_TOP,
    BetType.THREE_TOD,
    BetType.TWO_BOTTOM,
    BetType.RUN_TOP,
    BetType.RUN_BOTTOM,
  ],
}
