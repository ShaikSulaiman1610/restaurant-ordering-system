
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../../infrastructure/database/entities/user.entity.js';
import { RestaurantMembership } from '../../infrastructure/database/entities/restaurant-membership.entity.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { TenantAuthorizationGuard } from './tenant-authorization.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RestaurantMembership,
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtAuthGuard,
    TenantAuthorizationGuard,
  ],

  exports: [
    AuthService,
    JwtAuthGuard,
    TenantAuthorizationGuard,
    TypeOrmModule,
    JwtModule,
  ],
})
export class AuthModule {}
