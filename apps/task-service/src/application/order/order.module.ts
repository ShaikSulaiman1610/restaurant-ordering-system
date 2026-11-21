
import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
