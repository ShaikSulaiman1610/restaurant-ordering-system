
import { Module } from '@nestjs/common';

import { ModifierController } from './modifier.controller';
import { ModifierService } from './modifier.service';
import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [ModifierController],
  providers: [ModifierService],
})
export class ModifierModule {}
