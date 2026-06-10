import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCommissionSystem1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── system_config ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "system_config" (
        "key"        VARCHAR NOT NULL,
        "value"      VARCHAR NOT NULL,
        CONSTRAINT "PK_system_config" PRIMARY KEY ("key")
      )
    `)
    await queryRunner.query(`
      INSERT INTO "system_config" ("key", "value") VALUES ('agent_commission_rate', '0')
    `)

    // ─── houses: เพิ่ม commission_rate ───────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "houses" ADD COLUMN "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0
    `)

    // ─── bet_items: เพิ่ม snapshot commission ────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "bet_items"
        ADD COLUMN "commission_amount"       DECIMAL(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "agent_commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0
    `)

    // ─── bets: เพิ่ม house_id ────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "bets" ADD COLUMN "house_id" UUID
    `)
    await queryRunner.query(`CREATE INDEX "IDX_bets_house_id" ON "bets" ("house_id")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bets_house_id"`)
    await queryRunner.query(`ALTER TABLE "bets" DROP COLUMN "house_id"`)
    await queryRunner.query(`ALTER TABLE "bet_items" DROP COLUMN "agent_commission_amount"`)
    await queryRunner.query(`ALTER TABLE "bet_items" DROP COLUMN "commission_amount"`)
    await queryRunner.query(`ALTER TABLE "houses" DROP COLUMN "commission_rate"`)
    await queryRunner.query(`DROP TABLE "system_config"`)
  }
}
