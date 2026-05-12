import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm'
import { DrawScheduleType, ResultStructure } from '@lotto/shared'
import { PrizeRate } from './prize-rate.entity'
import { LotteryRound } from './lottery-round.entity'

@Entity('lottery_types')
export class LotteryType {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', unique: true })
  code: string

  @Column({ type: 'varchar' })
  draw_schedule_type: DrawScheduleType

  @Column({ type: 'json' })
  draw_days: number[] | string[]

  @Column({ type: 'varchar' })
  draw_time: string

  @Column({ type: 'varchar' })
  result_structure: ResultStructure

  @Column({ type: 'int', default: 30 })
  close_before_minutes: number

  @Column({ type: 'boolean', default: true })
  is_active: boolean

  @OneToMany(() => PrizeRate, (pr) => pr.lottery_type)
  prize_rates: PrizeRate[]

  @OneToMany(() => LotteryRound, (r) => r.lottery_type)
  rounds: LotteryRound[]
}
