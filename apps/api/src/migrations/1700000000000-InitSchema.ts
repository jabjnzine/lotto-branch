import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── users ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "email"      VARCHAR      NOT NULL,
        "password"   VARCHAR      NOT NULL,
        "name"       VARCHAR      NOT NULL,
        "role"       VARCHAR      NOT NULL DEFAULT 'admin',
        "house_id"   UUID,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`)

    // ─── houses ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "houses" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "name"       VARCHAR   NOT NULL,
        "owner_id"   UUID      NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_houses" PRIMARY KEY ("id")
      )
    `)

    // ─── lottery_types ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lottery_types" (
        "id"                    UUID      NOT NULL DEFAULT gen_random_uuid(),
        "name"                  VARCHAR   NOT NULL,
        "code"                  VARCHAR   NOT NULL,
        "draw_schedule_type"    VARCHAR   NOT NULL,
        "draw_days"             JSON      NOT NULL,
        "draw_time"             VARCHAR   NOT NULL,
        "result_structure"      VARCHAR   NOT NULL,
        "close_before_minutes"  INTEGER   NOT NULL DEFAULT 30,
        "is_active"             BOOLEAN   NOT NULL DEFAULT true,
        CONSTRAINT "PK_lottery_types"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lottery_types_code" UNIQUE ("code")
      )
    `)

    // ─── prize_rates ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "prize_rates" (
        "id"               UUID           NOT NULL DEFAULT gen_random_uuid(),
        "lottery_type_id"  UUID           NOT NULL,
        "bet_type"         VARCHAR        NOT NULL,
        "payout_rate"      DECIMAL(10,2)  NOT NULL,
        "max_per_number"   DECIMAL(12,2),
        CONSTRAINT "PK_prize_rates" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_prize_rates_lt_bt" ON "prize_rates" ("lottery_type_id", "bet_type")`)

    // ─── lottery_rounds ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lottery_rounds" (
        "id"               UUID      NOT NULL DEFAULT gen_random_uuid(),
        "lottery_type_id"  UUID      NOT NULL,
        "draw_date"        DATE      NOT NULL,
        "open_at"          TIMESTAMP NOT NULL,
        "close_at"         TIMESTAMP NOT NULL,
        "status"           VARCHAR   NOT NULL DEFAULT 'open',
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lottery_rounds" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_rounds_lt_status"    ON "lottery_rounds" ("lottery_type_id", "status")`)
    await queryRunner.query(`CREATE INDEX "IDX_rounds_lt_draw_date" ON "lottery_rounds" ("lottery_type_id", "draw_date")`)

    // ─── lottery_results ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lottery_results" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "round_id"    UUID         NOT NULL,
        "first_prize" VARCHAR,
        "three_top"   VARCHAR,
        "three_front" JSON,
        "three_back"  JSON,
        "two_last"    VARCHAR(2),
        "is_official" BOOLEAN      NOT NULL DEFAULT false,
        "source"      VARCHAR      NOT NULL DEFAULT 'manual',
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lottery_results"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lottery_results_round" UNIQUE ("round_id")
      )
    `)

    // ─── restrictions ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "restrictions" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "round_id"         UUID          NOT NULL,
        "number"           VARCHAR       NOT NULL,
        "bet_type"         VARCHAR       NOT NULL,
        "restriction_type" VARCHAR       NOT NULL,
        "limit_amount"     DECIMAL(12,2),
        "created_at"       TIMESTAMP     NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMP,
        CONSTRAINT "PK_restrictions" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_restrictions_round"        ON "restrictions" ("round_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_restrictions_round_num_bt" ON "restrictions" ("round_id", "number", "bet_type")`)

    // ─── bets ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bets" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "round_id"         UUID          NOT NULL,
        "lottery_type_id"  UUID          NOT NULL,
        "user_id"          UUID          NOT NULL,
        "note"             VARCHAR,
        "total_amount"     DECIMAL(12,2) NOT NULL DEFAULT 0,
        "status"           VARCHAR       NOT NULL DEFAULT 'pending',
        "created_at"       TIMESTAMP     NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMP,
        CONSTRAINT "PK_bets" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_bets_round_id"     ON "bets" ("round_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_bets_round_status" ON "bets" ("round_id", "status")`)
    await queryRunner.query(`CREATE INDEX "IDX_bets_user_id"      ON "bets" ("user_id")`)

    // ─── bet_items ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bet_items" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "bet_id"       UUID          NOT NULL,
        "number"       VARCHAR       NOT NULL,
        "bet_type"     VARCHAR       NOT NULL,
        "amount"       DECIMAL(12,2) NOT NULL,
        "payout_rate"  DECIMAL(10,2) NOT NULL,
        "win_amount"   DECIMAL(12,2),
        "deleted_at"   TIMESTAMP,
        CONSTRAINT "PK_bet_items" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_bet_items_bet_id"    ON "bet_items" ("bet_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_bet_items_num_bt"    ON "bet_items" ("number", "bet_type")`)

    // ─── audit_logs ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID      NOT NULL,
        "action"      VARCHAR   NOT NULL,
        "entity_type" VARCHAR   NOT NULL,
        "entity_id"   UUID,
        "before"      JSON,
        "after"       JSON,
        "ip_address"  VARCHAR   NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id"   ON "audit_logs" ("user_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity"    ON "audit_logs" ("entity_type", "entity_id")`)

    // ─── Seed: lottery_types ──────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "lottery_types"
        ("id", "name", "code", "draw_schedule_type", "draw_days", "draw_time", "result_structure", "close_before_minutes", "is_active")
      VALUES
        (gen_random_uuid(), 'หวยรัฐบาลไทย',    'TH',            'monthly_dates', '[1, 16]',                              '15:30', 'thai_full',  30, true),
        (gen_random_uuid(), 'หวยลาวพัฒนา',     'LAO_PATTHANA',  'weekdays',      '["MON","TUE","WED","THU","FRI"]',      '20:00', 'thai_full',  30, true),
        (gen_random_uuid(), 'หวยลาวซุปเปอร์',  'LAO_SUPER',     'daily',         '[]',                                   '21:00', 'lao_5digit', 30, true),
        (gen_random_uuid(), 'หวยลาวสตาร์/HD',  'LAO_STAR',      'daily',         '[]',                                   '21:30', 'lao_3_2',   30, true)
    `)

    // ─── Seed: prize_rates ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['3_top','3_tod','3_front','3_back','2_top','2_bottom','run_top','run_bottom']),
             unnest(ARRAY[500, 120, 450, 450, 70, 70, 3.2, 4.2]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'TH'
    `)
    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['3_top','3_tod','3_front','3_back','2_top','2_bottom','run_top','run_bottom']),
             unnest(ARRAY[500, 120, 450, 450, 70, 70, 3.2, 4.2]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'LAO_PATTHANA'
    `)
    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['5_top','2_top','2_bottom','run_top','run_bottom']),
             unnest(ARRAY[50000, 70, 70, 3.2, 4.2]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'LAO_SUPER'
    `)
    await queryRunner.query(`
      INSERT INTO "prize_rates" ("lottery_type_id", "bet_type", "payout_rate")
      SELECT id, unnest(ARRAY['3_top','3_tod','2_bottom','run_top','run_bottom']),
             unnest(ARRAY[500, 120, 70, 3.2, 4.2]::DECIMAL[])
      FROM "lottery_types" WHERE "code" = 'LAO_STAR'
    `)

    // ─── Seed: admin user (password: admin1234) ───────────────────────────
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password", "name", "role")
      VALUES (
        'admin@example.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'Admin',
        'admin'
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "bet_items"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "bets"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "restrictions"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "lottery_results"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "lottery_rounds"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "prize_rates"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "lottery_types"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "houses"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`)
  }
}
