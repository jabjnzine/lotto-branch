import { MigrationInterface, QueryRunner } from 'typeorm'

export class FixLaoPatthanaDays1700000000005 implements MigrationInterface {
  name = 'FixLaoPatthanaDays1700000000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lottery_types"
      SET "draw_days" = '["MON","WED","FRI"]'
      WHERE "code" = 'LAO_PATTHANA'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lottery_types"
      SET "draw_days" = '["MON","TUE","WED","THU","FRI"]'
      WHERE "code" = 'LAO_PATTHANA'
    `)
  }
}
