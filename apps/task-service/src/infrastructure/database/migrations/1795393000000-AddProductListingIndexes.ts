
import {
  MigrationInterface,
  QueryRunner,
  TableIndex,
} from 'typeorm';

export class AddProductListingIndexes1795393000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_category_created_at',
        columnNames: ['categoryId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_created_at',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'products',
      'IDX_products_created_at',
    );

    await queryRunner.dropIndex(
      'products',
      'IDX_products_category_created_at',
    );
  }
}
