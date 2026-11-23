
import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class CreateAuthTables1795392000000
  implements MigrationInterface
{
  name = 'CreateAuthTables1795392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email"
      ON "users" (LOWER(TRIM("email")))
    `);

    await queryRunner.query(`
      CREATE TABLE "restaurant_memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "restaurant_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "FK_memberships_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_memberships_restaurant"
          FOREIGN KEY ("restaurant_id")
          REFERENCES "tenants"("id")
          ON DELETE CASCADE,

        CONSTRAINT "UQ_memberships_user_restaurant"
          UNIQUE ("user_id", "restaurant_id"),

        CONSTRAINT "CHK_memberships_role"
          CHECK ("role" IN ('OWNER', 'STAFF'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_memberships_restaurant_id"
      ON "restaurant_memberships" ("restaurant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "restaurant_memberships"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_users_email"
    `);

    await queryRunner.query(`
      DROP TABLE "users"
    `);
  }
}
