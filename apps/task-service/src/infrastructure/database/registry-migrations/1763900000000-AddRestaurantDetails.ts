
import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class AddRestaurantDetails1763900000000
  implements MigrationInterface
{
  name = 'AddRestaurantDetails1763900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "location" varchar(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "cover_image_url" varchar(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "cover_image_public_id" varchar(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_tenants_name_location"
      ON "tenants" (
        LOWER(TRIM("restaurant_name")),
        LOWER(TRIM("location"))
      )
      WHERE "location" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_tenants_name_location"
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN "updated_at",
      DROP COLUMN "cover_image_public_id",
      DROP COLUMN "cover_image_url",
      DROP COLUMN "location"
    `);
  }
}

