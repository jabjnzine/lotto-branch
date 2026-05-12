import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { ResultSource } from '@lotto/shared'
import { LotteryRound } from './lottery-round.entity'

@Entity('lottery_results')
export class LotteryResult {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', unique: true })
  round_id: string

  @Column({ type: 'varchar', nullable: true })
  first_prize: string | null

  @Column({ type: 'varchar', nullable: true })
  three_top: string | null

  @Column({ type: 'json', nullable: true })
  three_front: string[] | null

  @Column({ type: 'json', nullable: true })
  three_back: string[] | null

  @Column({ type: 'varchar', length: 2, nullable: true })
  two_last: string | null

  @Column({ type: 'boolean', default: false })
  is_official: boolean

  @Column({ type: 'varchar', default: ResultSource.MANUAL })
  source: ResultSource

  @CreateDateColumn()
  created_at: Date

  @OneToOne(() => LotteryRound, (r) => r.result)
  @JoinColumn({ name: 'round_id' })
  round: LotteryRound
}
