
import { Module } from '@nestjs/common';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { AuthModule } from '../auth/auth.module';

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
