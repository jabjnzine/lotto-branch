import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLaoNormal1700000000002 implements MigrationInterface {
  name = 'AddLaoNormal1700000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "lottery_types"
        ("id", "name", "code", "draw_schedule_type", "draw_days", "draw_time", "result_structure", "close_before_minutes", "is_active")
      VALUES
        (gen_random_uuid(), 'หวยลาว', 'LAO', 'daily', '[]', '20:00', 'lao_full', 30, true)
    `)

    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['3_top','3_tod','2_top','2_bottom','run_top','run_bottom']),
             unnest(ARRAY[500, 120, 70, 70, 3.2, 4.2]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'LAO'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "prize_rates" WHERE "lottery_type_id" IN (
        SELECT id FROM "lottery_types" WHERE "code" = 'LAO'
      )
    `)
    await queryRunner.query(`
      DELETE FROM "lottery_types" WHERE "code" = 'LAO'
    `)
  }
}
