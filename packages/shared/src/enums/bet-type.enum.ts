export enum BetType {
  FOUR_TOP = '4_top',
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
  [BetType.FOUR_TOP]: '4 ตัวบน',
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
  [BetType.FOUR_TOP]: 4,
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

/** จัดกลุ่มประเภทการแทงสำหรับ UI (สามตัว / ห้าตัว / สองตัว / เลขวิ่ง) */
export type BetTypeGroupId = 'three_digit' | 'four_digit' | 'five_digit' | 'two_digit' | 'run'

export const BET_TYPE_GROUP_LABEL: Record<BetTypeGroupId, string> = {
  three_digit: 'สามตัว',
  four_digit: 'สี่ตัว',
  five_digit: 'ห้าตัว',
  two_digit: 'สองตัว',
  run: 'เลขวิ่ง',
}

const THREE_DIGIT = new Set<BetType>([
  BetType.THREE_TOP,
  BetType.THREE_TOD,
  BetType.THREE_FRONT,
  BetType.THREE_BACK,
])

function betTypeGroupId(betType: BetType): BetTypeGroupId {
  if (THREE_DIGIT.has(betType)) return 'three_digit'
  if (betType === BetType.FOUR_TOP) return 'four_digit'
  if (betType === BetType.FIVE_TOP) return 'five_digit'
  if (betType === BetType.TWO_TOP || betType === BetType.TWO_BOTTOM) return 'two_digit'
  return 'run'
}

const GROUP_ORDER: BetTypeGroupId[] = ['three_digit', 'four_digit', 'five_digit', 'two_digit', 'run']

/** แบ่งตามลำดับที่ส่งเข้ามา (มักมาจาก LOTTERY_TYPE_BET_TYPES) — คืนเฉพาะกลุ่มที่มีประเภทจริง */
export function groupBetTypesForUi(allowedInOrder: BetType[]): {
  groupId: BetTypeGroupId
  title: string
  betTypes: BetType[]
}[] {
  const buckets: Record<BetTypeGroupId, BetType[]> = {
    three_digit: [],
    four_digit: [],
    five_digit: [],
    two_digit: [],
    run: [],
  }
  for (const bt of allowedInOrder) {
    buckets[betTypeGroupId(bt)].push(bt)
  }
  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({
    groupId: id,
    title: BET_TYPE_GROUP_LABEL[id],
    betTypes: buckets[id],
  }))
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
  LAO: [
    BetType.FOUR_TOP,
    BetType.THREE_TOP,
    BetType.THREE_TOD,
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
