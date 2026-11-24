
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from './infrastructure/database/entities/tenant.entity.js';

@Injectable()
export class TaskServiceService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      select: {
        id: true,
        restaurantName: true,
        databaseName: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
