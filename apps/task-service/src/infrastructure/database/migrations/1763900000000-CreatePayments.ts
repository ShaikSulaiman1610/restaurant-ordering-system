
import {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class CreatePayments1763900000000
  implements MigrationInterface
{
  name = 'CreatePayments1763900000000';

  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "transactionReference" varchar(150) NOT NULL,
        "failureReason" varchar(500),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_payments"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_payments_transaction_reference"
          UNIQUE ("transactionReference"),

        CONSTRAINT "FK_payments_order"
          FOREIGN KEY ("orderId")
          REFERENCES "orders"("id")
          ON DELETE RESTRICT,

        CONSTRAINT "CHK_payments_amount"
          CHECK ("amount" > 0),

        CONSTRAINT "CHK_payments_status"
          CHECK ("status" IN ('PENDING', 'PAID', 'FAILED'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payments_order_id"
      ON "payments" ("orderId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payments_one_paid_per_order"
      ON "payments" ("orderId")
      WHERE "status" = 'PAID'
    `);
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "payments"
    `);
  }
}

