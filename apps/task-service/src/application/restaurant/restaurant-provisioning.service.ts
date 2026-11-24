import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

import { Category } from '../../infrastructure/database/entities/category/category.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';
import { Modifier } from '../../infrastructure/database/entities/modifier/modifier.entity';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import { Order } from '../../infrastructure/database/entities/order/order.entity';
import { OrderItem } from '../../infrastructure/database/entities/order/order-item.entity';
import { Payment } from '../../infrastructure/database/entities/payment/payment.entity';

import { CreateCategories1762970000000 } from '../../infrastructure/database/migrations/1762970000000-CreateCategories';
import { CreateProducts1763530000000 } from '../../infrastructure/database/migrations/1763530000000-CreateProducts';
import { CreateModifiers1763700000000 } from '../../infrastructure/database/migrations/1763700000000-CreateModifiers';
import { CreateInventories1763790000000 } from '../../infrastructure/database/migrations/1763790000000-CreateInventories';
import { CreateOrders1763800000000 } from '../../infrastructure/database/migrations/1763800000000-CreateOrders';
import { CreatePayments1763900000000 } from '../../infrastructure/database/migrations/1763900000000-CreatePayments';
import { AddProductListingIndexes1795393000000 } from '../../infrastructure/database/migrations/1795393000000-AddProductListingIndexes';

@Injectable()
export class RestaurantProvisioningService {
  private readonly logger = new Logger(
    RestaurantProvisioningService.name,
  );

  private readonly createdDatabases = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
  ) {}

  generateDatabaseName(): string {
    return `restaurant_${randomUUID().replace(/-/g, '')}_db`;
  }

  private validateDatabaseName(databaseName: string): void {
    if (!/^restaurant_[a-f0-9]{32}_db$/.test(databaseName)) {
      throw new Error(
        'Invalid generated restaurant database name',
      );
    }
  }

  private createAdminConnection(): DataSource {
    return new DataSource({
      type: 'postgres',
      host: this.configService.getOrThrow<string>('DB_HOST'),
      port: Number(
        this.configService.getOrThrow<string>('DB_PORT'),
      ),
      username: this.configService.getOrThrow<string>(
        'DB_USERNAME',
      ),
      password: this.configService.getOrThrow<string>(
        'DB_PASSWORD',
      ),
      database: this.configService.getOrThrow<string>(
        'DB_REGISTRY_NAME',
      ),

      ssl:
        this.configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: true }
          : false,

      synchronize: false,

      extra: {
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    });
  }

  private createTenantConnection(
    databaseName: string,
  ): DataSource {
    return new DataSource({
      type: 'postgres',
      host: this.configService.getOrThrow<string>('DB_HOST'),
      port: Number(
        this.configService.getOrThrow<string>('DB_PORT'),
      ),
      username: this.configService.getOrThrow<string>(
        'DB_USERNAME',
      ),
      password: this.configService.getOrThrow<string>(
        'DB_PASSWORD',
      ),
      database: databaseName,

      ssl:
        this.configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: true }
          : false,

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
  }

  async provisionDatabase(
    databaseName: string,
  ): Promise<void> {
    this.validateDatabaseName(databaseName);

    const adminConnection = this.createAdminConnection();
    let databaseCreated = false;

    try {
      await adminConnection.initialize();

      await adminConnection.query(
        `CREATE DATABASE "${databaseName}"`,
      );

      databaseCreated = true;
      this.createdDatabases.add(databaseName);

      this.logger.log(
        `Created restaurant database: ${databaseName}`,
      );

      const tenantConnection =
        this.createTenantConnection(databaseName);

      try {
        await tenantConnection.initialize();

        await tenantConnection.runMigrations();

        this.logger.log(
          `Migrations completed for: ${databaseName}`,
        );
      } finally {
        if (tenantConnection.isInitialized) {
          await tenantConnection.destroy();
        }
      }
    } catch (error: unknown) {
      this.logger.error(
        `Provisioning failed for: ${databaseName}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      if (databaseCreated) {
        try {
          await this.cleanupDatabase(databaseName);
        } catch (cleanupError: unknown) {
          this.logger.error(
            `Cleanup failed for: ${databaseName}`,
            cleanupError instanceof Error
              ? cleanupError.stack
              : String(cleanupError),
          );
        }
      }

      throw new InternalServerErrorException(
        'Restaurant database provisioning failed',
      );
    } finally {
      if (adminConnection.isInitialized) {
        await adminConnection.destroy();
      }
    }
  }

  async cleanupDatabase(
    databaseName: string,
  ): Promise<void> {
    this.validateDatabaseName(databaseName);

    if (!this.createdDatabases.has(databaseName)) {
      throw new Error(
        'Cleanup denied: database was not created by this service instance',
      );
    }

    const adminConnection = this.createAdminConnection();

    try {
      await adminConnection.initialize();

      const registeredDatabases: Array<{ id: string }> =
        await adminConnection.query(
          'SELECT id FROM tenants WHERE database_name = $1 LIMIT 1',
          [databaseName],
        );

      if (registeredDatabases.length > 0) {
        throw new Error(
          'Cleanup denied: database is registered to a restaurant',
        );
      }

      await adminConnection.query(
        `DROP DATABASE "${databaseName}"`,
      );

      this.createdDatabases.delete(databaseName);

      this.logger.warn(
        `Cleaned up unregistered database: ${databaseName}`,
      );
    } finally {
      if (adminConnection.isInitialized) {
        await adminConnection.destroy();
      }
    }
  }
}
