import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { BetStatus } from '@lotto/shared'
import { LotteryRound } from './lottery-round.entity'
import { LotteryType } from './lottery-type.entity'
import { User } from './user.entity'
import { BetItem } from './bet-item.entity'

@Entity('bets')
@Index(['round_id'])
@Index(['round_id', 'status'])
@Index(['user_id'])
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  round_id: string

  @Column({ type: 'uuid' })
  lottery_type_id: string

  @Column({ type: 'uuid' })
  user_id: string

  @Column({ type: 'varchar', nullable: true })
  note: string | null

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount: string

  @Column({ type: 'varchar', default: BetStatus.PENDING })
  status: BetStatus

  @CreateDateColumn()
  created_at: Date

  @DeleteDateColumn()
  deleted_at: Date | null

  @ManyToOne(() => LotteryRound, (r) => r.bets)
  @JoinColumn({ name: 'round_id' })
  round: LotteryRound

  @ManyToOne(() => LotteryType)
  @JoinColumn({ name: 'lottery_type_id' })
  lottery_type: LotteryType

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @OneToMany(() => BetItem, (item) => item.bet, { cascade: true })
  items: BetItem[]
}
