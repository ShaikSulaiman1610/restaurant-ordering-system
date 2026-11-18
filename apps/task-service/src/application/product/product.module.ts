
import { Module } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
