
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateModifiers1763700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'modifiers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'additionalPrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'productId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'isAvailable',
            type: 'boolean',
            default: true,
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

    await queryRunner.createIndex(
      'modifiers',
      new TableIndex({
        name: 'IDX_modifiers_product_id',
        columnNames: ['productId'],
      }),
    );

    await queryRunner.createForeignKey(
      'modifiers',
      new TableForeignKey({
        name: 'FK_modifiers_product',
        columnNames: ['productId'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(
      'ALTER TABLE "modifiers" ADD CONSTRAINT "CHK_modifiers_additional_price_nonnegative" CHECK ("additionalPrice" >= 0)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('modifiers');
  }
}
