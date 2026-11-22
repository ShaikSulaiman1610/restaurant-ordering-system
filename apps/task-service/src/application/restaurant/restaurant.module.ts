
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module';

import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { RestaurantProvisioningService } from './restaurant-provisioning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    CloudinaryModule,
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    RestaurantProvisioningService,
  ],
  exports: [RestaurantService],
})
export class RestaurantModule {}
