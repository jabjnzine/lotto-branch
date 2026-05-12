import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm'
import { RoundStatus } from '@lotto/shared'
import { LotteryType } from './lottery-type.entity'
import { LotteryResult } from './lottery-result.entity'
import { Restriction } from './restriction.entity'
import { Bet } from './bet.entity'

@Entity('lottery_rounds')
@Index(['lottery_type_id', 'status'])
@Index(['lottery_type_id', 'draw_date'])
export class LotteryRound {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  lottery_type_id: string

  @Column({ type: 'date' })
  draw_date: string

  @Column({ type: 'timestamp' })
  open_at: Date

  @Column({ type: 'timestamp' })
  close_at: Date

  @Column({ type: 'varchar', default: RoundStatus.OPEN })
  status: RoundStatus

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => LotteryType, (lt) => lt.rounds)
  @JoinColumn({ name: 'lottery_type_id' })
  lottery_type: LotteryType

  @OneToOne(() => LotteryResult, (r) => r.round)
  result: LotteryResult

  @OneToMany(() => Restriction, (r) => r.round)
  restrictions: Restriction[]

  @OneToMany(() => Bet, (b) => b.round)
  bets: Bet[]
}
