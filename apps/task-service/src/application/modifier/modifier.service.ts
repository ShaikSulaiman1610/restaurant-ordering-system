
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service.js';
import { Product } from '../../infrastructure/database/entities/product/product.entity.js';
import { Modifier } from '../../infrastructure/database/entities/modifier/modifier.entity.js';

import { CreateModifierDto } from './dto/create-modifier.dto.js';
import { UpdateModifierDto } from './dto/update-modifier.dto.js';

@Injectable()
export class ModifierService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  private async validateProduct(
    dataSource: DataSource,
    productId: string,
  ): Promise<void> {
    const product = await dataSource
      .getRepository(Product)
      .findOneBy({ id: productId });

    if (!product) {
      throw new BadRequestException(
        'Product does not exist in this restaurant',
      );
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;

      if (code === '23503') {
        throw new BadRequestException(
          'Invalid product reference',
        );
      }

      if (code === '23505') {
        throw new ConflictException(
          'Modifier already exists',
        );
      }

      if (code === '23514') {
        throw new BadRequestException(
          'Modifier violates database constraints',
        );
      }
    }

    throw error;
  }

  async create(
    tenantId: string,
    dto: CreateModifierDto,
  ): Promise<Modifier> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    await this.validateProduct(dataSource, dto.productId);

    const repository = dataSource.getRepository(Modifier);

    const modifier = repository.create({
      name: dto.name,
      description: dto.description ?? null,
      additionalPrice: dto.additionalPrice,
      productId: dto.productId,
      isAvailable: dto.isAvailable ?? true,
    });

    try {
      return await repository.save(modifier);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(tenantId: string): Promise<Modifier[]> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    return dataSource.getRepository(Modifier).find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    tenantId: string,
    modifierId: string,
  ): Promise<Modifier> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const modifier = await dataSource
      .getRepository(Modifier)
      .findOneBy({ id: modifierId });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    return modifier;
  }

  async update(
    tenantId: string,
    modifierId: string,
    dto: UpdateModifierDto,
  ): Promise<Modifier> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Modifier);

    const modifier = await repository.findOneBy({
      id: modifierId,
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    if (dto.productId !== undefined) {
      await this.validateProduct(dataSource, dto.productId);
      modifier.productId = dto.productId;
    }

    if (dto.name !== undefined) {
      modifier.name = dto.name;
    }

    if (dto.description !== undefined) {
      modifier.description = dto.description;
    }

    if (dto.additionalPrice !== undefined) {
      modifier.additionalPrice = dto.additionalPrice;
    }

    if (dto.isAvailable !== undefined) {
      modifier.isAvailable = dto.isAvailable;
    }

    try {
      return await repository.save(modifier);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(
    tenantId: string,
    modifierId: string,
  ): Promise<void> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Modifier);

    try {
      const result = await repository.delete({
        id: modifierId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('Modifier not found');
      }
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
