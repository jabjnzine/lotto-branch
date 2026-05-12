import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { BetType } from '@lotto/shared'
import { Bet } from './bet.entity'

@Entity('bet_items')
@Index(['bet_id'])
@Index(['number', 'bet_type'])
export class BetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  bet_id: string

  @Column({ type: 'varchar' })
  number: string

  @Column({ type: 'varchar' })
  bet_type: BetType

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  payout_rate: string

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  win_amount: string | null

  @DeleteDateColumn()
  deleted_at: Date | null

  @ManyToOne(() => Bet, (b) => b.items)
  @JoinColumn({ name: 'bet_id' })
  bet: Bet
}
