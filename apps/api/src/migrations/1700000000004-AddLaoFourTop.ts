import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLaoFourTop1700000000004 implements MigrationInterface {
  name = 'AddLaoFourTop1700000000004'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, '4_top', 60000
      FROM "lottery_types" WHERE "code" = 'LAO'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "prize_rates"
      WHERE "lottery_type_id" IN (
        SELECT id FROM "lottery_types" WHERE "code" = 'LAO'
      )
      AND "bet_type" = '4_top'
    `)
  }
}
