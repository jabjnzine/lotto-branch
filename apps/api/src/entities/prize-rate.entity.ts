import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { BetType } from '@lotto/shared'
import { LotteryType } from './lottery-type.entity'

@Entity('prize_rates')
@Index(['lottery_type_id', 'bet_type'])
export class PrizeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  lottery_type_id: string

  @Column({ type: 'varchar' })
  bet_type: BetType

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  payout_rate: string

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  max_per_number: string | null

  @ManyToOne(() => LotteryType, (lt) => lt.prize_rates)
  @JoinColumn({ name: 'lottery_type_id' })
  lottery_type: LotteryType
}
