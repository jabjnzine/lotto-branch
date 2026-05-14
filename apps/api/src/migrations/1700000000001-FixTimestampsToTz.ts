import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixTimestampsToTz1700000000001 implements MigrationInterface {
  name = 'FixTimestampsToTz1700000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure UTC for consistent conversion (redundant with extra.options but safe)
    await queryRunner.query(`SET timezone = 'UTC'`)

    const timestampColumns: Array<{ table: string; columns: string[] }> = [
      { table: 'users', columns: ['created_at', 'deleted_at'] },
      { table: 'houses', columns: ['created_at', 'deleted_at'] },
      { table: 'lottery_rounds', columns: ['created_at', 'open_at', 'close_at'] },
      { table: 'lottery_results', columns: ['created_at'] },
      { table: 'restrictions', columns: ['created_at', 'deleted_at'] },
      { table: 'bets', columns: ['created_at', 'deleted_at'] },
      { table: 'bet_items', columns: ['deleted_at'] },
      { table: 'audit_logs', columns: ['created_at'] },
    ]

    for (const { table, columns } of timestampColumns) {
      for (const col of columns) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE TIMESTAMPTZ`,
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const timestampColumns: Array<{ table: string; columns: string[] }> = [
      { table: 'users', columns: ['created_at', 'deleted_at'] },
      { table: 'houses', columns: ['created_at', 'deleted_at'] },
      { table: 'lottery_rounds', columns: ['created_at', 'open_at', 'close_at'] },
      { table: 'lottery_results', columns: ['created_at'] },
      { table: 'restrictions', columns: ['created_at', 'deleted_at'] },
      { table: 'bets', columns: ['created_at', 'deleted_at'] },
      { table: 'bet_items', columns: ['deleted_at'] },
      { table: 'audit_logs', columns: ['created_at'] },
    ]

    for (const { table, columns } of timestampColumns) {
      for (const col of columns) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE TIMESTAMP`,
        )
      }
    }
  }
}
