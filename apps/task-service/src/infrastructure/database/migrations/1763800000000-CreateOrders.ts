
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOrders1763800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customerName',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'customerPhone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'totalAmount',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'orders_status_enum',
            enum: [
              'PENDING',
              'CONFIRMED',
              'PREPARING',
              'COMPLETED',
              'CANCELLED',
            ],
            default: "'PENDING'",
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'integer',
          },
          {
            name: 'unitPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_order_items_order_id',
        columnNames: ['orderId'],
      }),
    );

    await queryRunner.createIndex(
      'order_items',
      new TableIndex({
        name: 'IDX_order_items_product_id',
        columnNames: ['productId'],
      }),
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "CHK_order_items_quantity_positive" CHECK ("quantity" > 0)',
    );

    await queryRunner.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "CHK_orders_total_nonnegative" CHECK ("totalAmount" >= 0)',
    );

    await queryRunner.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "CHK_order_items_unit_price_nonnegative" CHECK ("unitPrice" >= 0)',
    );

    await queryRunner.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "CHK_order_items_subtotal_nonnegative" CHECK ("subtotal" >= 0)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_items', true);
    await queryRunner.dropTable('orders', true);
  }
}
