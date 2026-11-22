
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';

import { Tenant } from './infrastructure/database/entities/tenant.entity';
import { TenantDatabaseModule } from './infrastructure/database/tenant-database.module';

import { CategoryModule } from './application/category/category.module';
import { ProductModule } from './application/product/product.module';
import { ModifierModule } from './application/modifier/modifier.module';
import { InventoryModule } from './application/inventory/inventory.module';
import { OrderModule } from './application/order/order.module';
import { RestaurantModule } from './application/restaurant/restaurant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_REGISTRY_NAME'),

        entities: [Tenant],
        synchronize: false,

        extra: {
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        },
      }),
    }),

    TypeOrmModule.forFeature([Tenant]),

    TenantDatabaseModule,
    CategoryModule,
    ProductModule,
    ModifierModule,
    InventoryModule,
    OrderModule,
    RestaurantModule,
  ],
  controllers: [TaskServiceController],
  providers: [TaskServiceService],
})
export class TaskServiceModule {}
