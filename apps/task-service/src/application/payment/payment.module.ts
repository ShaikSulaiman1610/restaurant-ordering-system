
import { Module } from '@nestjs/common';

import { TenantDatabaseModule } from '../../infrastructure/database/tenant-database.module';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [TenantDatabaseModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
