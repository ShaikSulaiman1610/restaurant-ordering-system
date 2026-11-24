
import { Module } from '@nestjs/common';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module.js';

import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
