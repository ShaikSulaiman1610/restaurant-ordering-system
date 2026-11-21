
import { Module } from '@nestjs/common';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
