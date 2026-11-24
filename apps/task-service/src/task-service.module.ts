import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as pg from 'pg';

import { TaskServiceController } from './task-service.controller.js';
import { TaskServiceService } from './task-service.service.js';

import { Tenant } from './infrastructure/database/entities/tenant.entity.js';
import { User } from './infrastructure/database/entities/user.entity.js';
import { RestaurantMembership } from './infrastructure/database/entities/restaurant-membership.entity.js';
import { TenantDatabaseModule } from './infrastructure/database/tenant-database.module.js';

import { AuthModule } from './application/auth/auth.module.js';
import { ApiSecurityGuard } from './application/auth/api-security.guard.js';

import { CategoryModule } from './application/category/category.module.js';
import { ProductModule } from './application/product/product.module.js';
import { ModifierModule } from './application/modifier/modifier.module.js';
import { InventoryModule } from './application/inventory/inventory.module.js';
import { OrderModule } from './application/order/order.module.js';
import { RestaurantModule } from './application/restaurant/restaurant.module.js';
import { PaymentModule } from './application/payment/payment.module.js';

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

        driver: pg,

        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_REGISTRY_NAME'),

        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: true }
            : false,

        entities: [
          Tenant,
          User,
          RestaurantMembership,
        ],

        synchronize: false,

        extra: {
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        },
      }),
    }),

    TypeOrmModule.forFeature([
      Tenant,
      User,
      RestaurantMembership,
    ]),

    AuthModule,
    TenantDatabaseModule,
    CategoryModule,
    ProductModule,
    ModifierModule,
    InventoryModule,
    OrderModule,
    RestaurantModule,
    PaymentModule,
  ],

  controllers: [TaskServiceController],

  providers: [
    TaskServiceService,
    {
      provide: APP_GUARD,
      useClass: ApiSecurityGuard,
    },
  ],
})
export class TaskServiceModule {}