
import { Module } from '@nestjs/common';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
