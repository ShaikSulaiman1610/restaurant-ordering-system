import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  RestaurantMembership,
  RestaurantRole,
} from '../../infrastructure/database/entities/restaurant-membership.entity.js';

import {
  JwtAuthGuard,
  AuthenticatedRequest,
} from './jwt-auth.guard.js';

@Injectable()
export class ApiSecurityGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,

    private readonly configService: ConfigService,

    @InjectRepository(RestaurantMembership)
    private readonly membershipRepository:
      Repository<RestaurantMembership>,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const method = request.method.toUpperCase();

    const path = request.path.replace(/\/+$/, '') || '/';

    const demoMode =
      this.configService.get<string>('DEMO_MODE') === 'true';

    // Temporary public demo protection
    if (
      demoMode &&
      method === 'POST' &&
      ['/auth/register', '/restaurants'].includes(path)
    ) {
      throw new ForbiddenException(
        'Registration and restaurant provisioning are disabled in demo mode',
      );
    }

    // Public health endpoint
    if (method === 'GET' && path === '/') {
      return true;
    }

    // Public authentication endpoints
    if (
      method === 'POST' &&
      ['/auth/register', '/auth/login'].includes(path)
    ) {
      return true;
    }

    // Public restaurant browsing
    if (
      method === 'GET' &&
      /^\/restaurants(?:\/[^/]+)?$/.test(path)
    ) {
      return true;
    }

    // Public menu browsing
    if (
      method === 'GET' &&
      /^\/tenants\/[^/]+\/(categories|products|modifiers)(?:\/[^/]+)?$/.test(path)
    ) {
      return true;
    }

    // Block internal tenant debug endpoints
    if (
      path === '/tenants' ||
      /^\/tenants\/[^/]+\/connection-test$/.test(path)
    ) {
      throw new ForbiddenException(
        'Internal endpoint is not publicly accessible',
      );
    }

    // All remaining endpoints require JWT authentication
    await this.jwtAuthGuard.canActivate(context);

    if (
      method === 'GET' &&
      path === '/auth/me'
    ) {
      return true;
    }

    // Authenticated restaurant creation
    if (
      method === 'POST' &&
      path === '/restaurants'
    ) {
      return true;
    }

    // Identify restaurant or tenant
    const tenantId =
      request.params.tenantId ??
      (
        path.startsWith('/restaurants/')
          ? request.params.id
          : undefined
      );

    if (
      typeof tenantId !== 'string' ||
      !request.user
    ) {
      throw new ForbiddenException(
        'Access denied',
      );
    }

    await new ParseUUIDPipe().transform(
      tenantId,
      {
        type: 'param',
        data: 'tenantId',
      },
    );

    // Verify restaurant ownership
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
        'You do not have permission to access this restaurant',
      );
    }

    return true;
  }
}