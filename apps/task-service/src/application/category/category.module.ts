
import { Module } from '@nestjs/common';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';
import { CategoryController } from './category.controller.js';
import { CategoryService } from './category.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TenantDatabaseModule,
    AuthModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
