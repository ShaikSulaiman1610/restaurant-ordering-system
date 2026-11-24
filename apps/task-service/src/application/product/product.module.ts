
import { Module } from '@nestjs/common';

import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
