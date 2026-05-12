import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './user.entity'

@Entity('audit_logs')
@Index(['user_id'])
@Index(['entity_type', 'entity_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  user_id: string

  @Column({ type: 'varchar' })
  action: string

  @Column({ type: 'varchar' })
  entity_type: string

  @Column({ type: 'uuid', nullable: true })
  entity_id: string | null

  @Column({ type: 'json', nullable: true })
  before: Record<string, unknown> | null

  @Column({ type: 'json', nullable: true })
  after: Record<string, unknown> | null

  @Column({ type: 'varchar' })
  ip_address: string

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
