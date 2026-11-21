
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInventories1763790000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'quantity',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'lowStockThreshold',
            type: 'integer',
            default: 5,
            isNullable: false,
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

    await queryRunner.createForeignKey(
      'inventories',
      new TableForeignKey({
        name: 'FK_inventories_product',
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      ALTER TABLE "inventories"
      ADD CONSTRAINT "CHK_inventories_quantity_nonnegative"
      CHECK ("quantity" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "inventories"
      ADD CONSTRAINT "CHK_inventories_threshold_nonnegative"
      CHECK ("lowStockThreshold" >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventories');
  }
}
