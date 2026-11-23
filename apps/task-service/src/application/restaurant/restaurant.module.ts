
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from '../../infrastructure/database/entities/tenant.entity';
import { RestaurantMembership } from '../../infrastructure/database/entities/restaurant-membership.entity';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module';

import { AuthModule } from '../auth/auth.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { RestaurantProvisioningService } from './restaurant-provisioning.service';

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
