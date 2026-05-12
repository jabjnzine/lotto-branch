import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './user.entity'

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'uuid' })
  owner_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User

  @CreateDateColumn()
  created_at: Date

  @DeleteDateColumn()
  deleted_at: Date | null
}
