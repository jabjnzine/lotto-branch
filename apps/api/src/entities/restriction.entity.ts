import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { BetType, RestrictionType } from '@lotto/shared'
import { LotteryRound } from './lottery-round.entity'

@Entity('restrictions')
@Index(['round_id'])
@Index(['round_id', 'number', 'bet_type'])
export class Restriction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  round_id: string

  @Column({ type: 'varchar' })
  number: string

  @Column({ type: 'varchar' })
  bet_type: BetType

  @Column({ type: 'varchar' })
  restriction_type: RestrictionType

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  limit_amount: string | null

  @CreateDateColumn()
  created_at: Date

  @DeleteDateColumn()
  deleted_at: Date | null

  @ManyToOne(() => LotteryRound, (r) => r.restrictions)
  @JoinColumn({ name: 'round_id' })
  round: LotteryRound
}
