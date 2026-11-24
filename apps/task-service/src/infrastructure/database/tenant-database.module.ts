
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from './entities/tenant.entity.js';
import { TenantConnectionService } from './tenant-connection/tenant-connection.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
  ],
  providers: [
    TenantConnectionService,
  ],
  exports: [
    TenantConnectionService,
  ],
})
export class TenantDatabaseModule {}
