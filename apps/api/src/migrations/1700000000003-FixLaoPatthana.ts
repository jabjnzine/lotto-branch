import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixLaoPatthana1700000000003 implements MigrationInterface {
  name = 'FixLaoPatthana1700000000003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lottery_types"
      SET "result_structure" = 'lao_5_2'
      WHERE "code" = 'LAO_PATTHANA'
    `)

    await queryRunner.query(`
      DELETE FROM "prize_rates"
      WHERE "lottery_type_id" IN (
        SELECT id FROM "lottery_types" WHERE "code" = 'LAO_PATTHANA'
      )
      AND "bet_type" IN ('3_top', '3_tod', '3_front', '3_back')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lottery_types"
      SET "result_structure" = 'thai_full'
      WHERE "code" = 'LAO_PATTHANA'
    `)

    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['3_top','3_tod','3_front','3_back']),
             unnest(ARRAY[500, 120, 450, 450]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'LAO_PATTHANA'
    `)
  }
}
