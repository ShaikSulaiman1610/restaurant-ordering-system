
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Category } from '../apps/task-service/src/infrastructure/database/entities/category/category.entity';
import { Product } from '../apps/task-service/src/infrastructure/database/entities/product/product.entity';
import { Modifier } from '../apps/task-service/src/infrastructure/database/entities/modifier/modifier.entity';
import { Inventory } from '../apps/task-service/src/infrastructure/database/entities/inventory/inventory.entity';
import { Order } from '../apps/task-service/src/infrastructure/database/entities/order/order.entity';
import { OrderItem } from '../apps/task-service/src/infrastructure/database/entities/order/order-item.entity';
import { Payment } from '../apps/task-service/src/infrastructure/database/entities/payment/payment.entity';

import { CreateCategories1762970000000 } from '../apps/task-service/src/infrastructure/database/migrations/1762970000000-CreateCategories';
import { CreateProducts1763530000000 } from '../apps/task-service/src/infrastructure/database/migrations/1763530000000-CreateProducts';
import { CreateModifiers1763700000000 } from '../apps/task-service/src/infrastructure/database/migrations/1763700000000-CreateModifiers';
import { CreateInventories1763790000000 } from '../apps/task-service/src/infrastructure/database/migrations/1763790000000-CreateInventories';
import { CreateOrders1763800000000 } from '../apps/task-service/src/infrastructure/database/migrations/1763800000000-CreateOrders';
import { CreatePayments1763900000000 } from '../apps/task-service/src/infrastructure/database/migrations/1763900000000-CreatePayments';
import { AddProductListingIndexes1795393000000 } from '../apps/task-service/src/infrastructure/database/migrations/1795393000000-AddProductListingIndexes';

config();

async function main(): Promise<void> {
  const databaseName = process.env.TENANT_DB_NAME;

  if (!databaseName) {
    throw new Error('TENANT_DB_NAME is required');
  }

  if (!/^restaurant_[a-z0-9_]+_db$/.test(databaseName)) {
    throw new Error('Invalid tenant database name');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: databaseName,

    entities: [
      Category,
      Product,
      Modifier,
      Inventory,
      Order,
      OrderItem,
      Payment,
    ],

    migrations: [
      CreateCategories1762970000000,
      CreateProducts1763530000000,
      CreateModifiers1763700000000,
      CreateInventories1763790000000,
      CreateOrders1763800000000,
      CreatePayments1763900000000,
      AddProductListingIndexes1795393000000,
    ],

    synchronize: false,
    migrationsTransactionMode: 'all',

    extra: {
      max: 2,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  });

  try {
    await dataSource.initialize();

    console.log(
      `Connected to tenant database: ${databaseName}`,
    );

    const migrations = await dataSource.runMigrations();

    console.log(
      `Successfully executed ${migrations.length} migration(s)`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error: unknown) => {
  console.error('Tenant migration failed:', error);
  process.exitCode = 1;
});
