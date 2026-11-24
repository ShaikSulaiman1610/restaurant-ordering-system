import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Tenant } from '../apps/task-service/src/infrastructure/database/entities/tenant.entity';

import { AddRestaurantDetails1763900000000 } from '../apps/task-service/src/infrastructure/database/registry-migrations/1763900000000-AddRestaurantDetails';

import { CreateAuthTables1795392000000 } from '../apps/task-service/src/infrastructure/database/registry-migrations/1795392000000-CreateAuthTables';

config();

async function main(): Promise<void> {
  const databaseName = process.env.DB_REGISTRY_NAME;

  if (!databaseName) {
    throw new Error('DB_REGISTRY_NAME is required');
  }

  if (databaseName !== 'restaurant_registry') {
    throw new Error(
      'Registry migration must target restaurant_registry',
    );
  }

  const dataSource = new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),

    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,

    database: databaseName,

    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: true }
      : false,

    entities: [Tenant],

    migrations: [
      AddRestaurantDetails1763900000000,
      CreateAuthTables1795392000000,
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
      `Connected to registry database: ${databaseName}`,
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
  console.error('Registry migration failed:', error);
  process.exitCode = 1;
});