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
import { UserRole } from '@lotto/shared'

@Entity('users')
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', unique: true })
  email: string

  @Column({ type: 'varchar' })
  password: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: UserRole.ADMIN })
  role: UserRole

  @Column({ type: 'uuid', nullable: true })
  house_id: string | null

  @CreateDateColumn()
  created_at: Date

  @DeleteDateColumn()
  deleted_at: Date | null
}
