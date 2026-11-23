
import 'reflect-metadata';

import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { RestaurantProvisioningService } from './restaurant-provisioning.service';

config();

const integrationEnabled =
  process.env.RUN_DB_INTEGRATION_TESTS === 'true';

const describeIntegration = integrationEnabled
  ? describe
  : describe.skip;

describeIntegration('RestaurantProvisioningService Integration', () => {
  jest.setTimeout(60000);

  let service: RestaurantProvisioningService;
  let databaseName: string;
  let adminConnection: DataSource;
  let provisioningStarted = false;
  let cleanupCompleted = false;

  async function databaseExists(): Promise<boolean> {
    const rows: Array<{ exists: boolean }> =
      await adminConnection.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM pg_database
          WHERE datname = $1
        ) AS exists
        `,
        [databaseName],
      );

    return rows[0]?.exists === true;
  }

  beforeAll(async () => {
    if (process.env.DB_REGISTRY_NAME !== 'restaurant_registry') {
      throw new Error(
        'Integration test requires restaurant_registry',
      );
    }

    const configService = new ConfigService();

    service = new RestaurantProvisioningService(configService);
    databaseName = service.generateDatabaseName();

    adminConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_REGISTRY_NAME,
      synchronize: false,
      extra: {
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    });

    await adminConnection.initialize();
  });

  afterAll(async () => {
    try {
      if (
        provisioningStarted &&
        !cleanupCompleted &&
        adminConnection?.isInitialized &&
        databaseName
      ) {
        if (await databaseExists()) {
          try {
            await service.cleanupDatabase(databaseName);
            cleanupCompleted = true;
          } catch (error: unknown) {
            console.error(
              `Temporary database cleanup failed: ${databaseName}`,
              error,
            );

            throw error;
          }
        }
      }
    } finally {
      if (adminConnection?.isInitialized) {
        await adminConnection.destroy();
      }
    }
  });

  it('generates unique, valid database names', () => {
    const secondDatabaseName = service.generateDatabaseName();

    expect(databaseName).toMatch(
      /^restaurant_[a-f0-9]{32}_db$/,
    );

    expect(secondDatabaseName).toMatch(
      /^restaurant_[a-f0-9]{32}_db$/,
    );

    expect(secondDatabaseName).not.toBe(databaseName);
  });

  it('provisions a database and runs all migrations', async () => {
    provisioningStarted = true;

    await service.provisionDatabase(databaseName);

    expect(await databaseExists()).toBe(true);

    const tenantConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: databaseName,
      synchronize: false,
      extra: {
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    });

    try {
      await tenantConnection.initialize();

      const tables: Array<{ tablename: string }> =
        await tenantConnection.query(
          `
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
          `,
        );

      const tableNames = tables.map(
        (row) => row.tablename,
      );

      expect(tableNames).toEqual(
        expect.arrayContaining([
          'categories',
          'products',
          'modifiers',
          'inventories',
          'orders',
          'order_items',
          'payments',
        ]),
      );

      const migrations: Array<{ count: string }> =
        await tenantConnection.query(
          'SELECT COUNT(*)::text AS count FROM migrations',
        );

      expect(Number(migrations[0]?.count)).toBe(7);
    } finally {
      if (tenantConnection.isInitialized) {
        await tenantConnection.destroy();
      }
    }
  });

  it('cleans up the temporary database', async () => {
    await service.cleanupDatabase(databaseName);

    cleanupCompleted = true;

    expect(await databaseExists()).toBe(false);
  });
});

