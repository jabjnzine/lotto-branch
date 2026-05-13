import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBuyerName1700000000001 implements MigrationInterface {
  name = 'AddBuyerName1700000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bets" ADD COLUMN "buyer_name" VARCHAR`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bets" DROP COLUMN "buyer_name"`)
  }
}
