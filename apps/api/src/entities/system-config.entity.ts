import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('system_config')
export class SystemConfig {
  @PrimaryColumn({ type: 'varchar' })
  key: string

  @Column({ type: 'varchar' })
  value: string
}
