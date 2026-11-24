
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  RestaurantMembership,
  RestaurantRole,
} from '../../infrastructure/database/entities/restaurant-membership.entity.js';

import { AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class TenantAuthorizationGuard implements CanActivate {
  constructor(
    @InjectRepository(RestaurantMembership)
    private readonly membershipRepository: Repository<RestaurantMembership>,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication is required',
      );
    }

    const tenantId = request.params.tenantId;

    if (typeof tenantId !== 'string') {
      throw new BadRequestException(
        'Restaurant ID is required',
      );
    }

    await new ParseUUIDPipe().transform(tenantId, {
      type: 'param',
      data: 'tenantId',
    });

    const membership =
      await this.membershipRepository.findOne({
        where: {
          userId: request.user.id,
          restaurantId: tenantId,
          role: RestaurantRole.OWNER,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to manage this restaurant',
      );
    }

    return true;
  }
}
