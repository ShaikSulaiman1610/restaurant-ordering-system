
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';

import { Tenant } from '../entities/tenant.entity';
import { Category } from '../entities/category/category.entity';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);

  private readonly connections = new Map<string, Promise<DataSource>>();

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly configService: ConfigService,
  ) {}

  async getConnection(tenantId: string): Promise<DataSource> {
    const tenant = await this.tenantRepository.findOneBy({
      id: tenantId,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const databaseName = tenant.databaseName;

    let connectionPromise = this.connections.get(databaseName);

    if (!connectionPromise) {
      this.logger.log(
        `Creating new connection pool for tenant database: ${databaseName}`,
      );

      connectionPromise = this.createConnection(databaseName);
      this.connections.set(databaseName, connectionPromise);
    } else {
      this.logger.log(
        `Reusing existing connection pool for tenant database: ${databaseName}`,
      );
    }

    try {
      return await connectionPromise;
    } catch (error) {
      if (this.connections.get(databaseName) === connectionPromise) {
        this.connections.delete(databaseName);
      }

      this.logger.error(
        `Failed to connect to tenant database: ${databaseName}`,
      );

      throw error;
    }
  }

  private async createConnection(
    databaseName: string,
  ): Promise<DataSource> {
    const dataSource = new DataSource({
      type: 'postgres',
      host: this.configService.getOrThrow<string>('DB_HOST'),
      port: Number(this.configService.getOrThrow<string>('DB_PORT')),
      username: this.configService.getOrThrow<string>('DB_USERNAME'),
      password: this.configService.getOrThrow<string>('DB_PASSWORD'),
      database: databaseName,

      // Register tenant-specific entities here
      entities: [Category],

      // Database schema changes happen through migrations
      synchronize: false,

      extra: {
        max: 5,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    });

    return dataSource.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    const connections = await Promise.allSettled(
      Array.from(this.connections.values()),
    );

    for (const result of connections) {
      if (result.status === 'fulfilled' && result.value.isInitialized) {
        await result.value.destroy();
      }
    }

    this.logger.log('Tenant database connection pools closed');
  }
}
