
import { Module } from '@nestjs/common';

import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
