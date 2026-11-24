
import { Module } from '@nestjs/common';

import { ModifierController } from './modifier.controller.js';
import { ModifierService } from './modifier.service.js';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [ModifierController],
  providers: [ModifierService],
})
export class ModifierModule {}
