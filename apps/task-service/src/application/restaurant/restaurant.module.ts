
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '../../infrastructure/database/entities/tenant.entity.js';
import { RestaurantMembership } from '../../infrastructure/database/entities/restaurant-membership.entity.js';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module.js';

import { AuthModule } from '../auth/auth.module.js';
import { RestaurantController } from './restaurant.controller.js';
import { RestaurantService } from './restaurant.service.js';
import { RestaurantProvisioningService } from './restaurant-provisioning.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      RestaurantMembership,
    ]),
    CloudinaryModule,
    AuthModule,
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    RestaurantProvisioningService,
  ],
  exports: [RestaurantService],
})
export class RestaurantModule {}
