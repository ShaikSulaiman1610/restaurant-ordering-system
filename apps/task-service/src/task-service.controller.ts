
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { TaskServiceService } from './task-service.service';
import { Tenant } from './infrastructure/database/entities/tenant.entity';
import { TenantConnectionService } from './infrastructure/database/tenant-connection/tenant-connection.service';

@Controller()
export class TaskServiceController {
  constructor(
    private readonly taskServiceService: TaskServiceService,
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  @Get()
  getHello(): string {
    return this.taskServiceService.getHello();
  }

  @Get('tenants')
  async getTenants(): Promise<Tenant[]> {
    return this.taskServiceService.getTenants();
  }

  // Temporary local development endpoint.
  // Remove before production deployment.
  @Get('tenants/:id/connection-test')
  async testTenantConnection(
    @Param('id', new ParseUUIDPipe()) tenantId: string,
  ): Promise<{ connected: boolean }> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    if (!connection.isInitialized) {
      throw new NotFoundException('Tenant database connection unavailable');
    }

    await connection.query('SELECT 1');

    return {
      connected: true,
    };
  }
}
