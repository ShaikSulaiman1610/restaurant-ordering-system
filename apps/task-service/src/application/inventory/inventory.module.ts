
import { Module } from '@nestjs/common';

import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
