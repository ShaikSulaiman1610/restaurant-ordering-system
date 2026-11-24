
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service.js';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity.js';
import { Product } from '../../infrastructure/database/entities/product/product.entity.js';

import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { UpdateInventoryDto } from './dto/update-inventory.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateInventoryDto,
  ): Promise<Inventory> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const productRepository = connection.getRepository(Product);
    const inventoryRepository = connection.getRepository(Inventory);

    const product = await productRepository.findOneBy({
      id: dto.productId,
    });

    if (!product) {
      throw new BadRequestException(
        'Product does not exist in this restaurant',
      );
    }

    const existingInventory = await inventoryRepository.findOneBy({
      productId: dto.productId,
    });

    if (existingInventory) {
      throw new ConflictException(
        'Inventory already exists for this product',
      );
    }

    const inventory = inventoryRepository.create({
      productId: dto.productId,
      quantity: dto.quantity,
      lowStockThreshold: dto.lowStockThreshold ?? 5,
    });

    try {
      return await inventoryRepository.save(inventory);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(tenantId: string): Promise<Inventory[]> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    return connection.getRepository(Inventory).find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    tenantId: string,
    inventoryId: string,
  ): Promise<Inventory> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const inventory = await connection
      .getRepository(Inventory)
      .findOneBy({ id: inventoryId });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return inventory;
  }

  async update(
    tenantId: string,
    inventoryId: string,
    dto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = connection.getRepository(Inventory);

    const inventory = await repository.findOneBy({
      id: inventoryId,
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (dto.quantity !== undefined) {
      inventory.quantity = dto.quantity;
    }

    if (dto.lowStockThreshold !== undefined) {
      inventory.lowStockThreshold = dto.lowStockThreshold;
    }

    try {
      return await repository.save(inventory);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(
    tenantId: string,
    inventoryId: string,
  ): Promise<void> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const result = await connection
      .getRepository(Inventory)
      .delete({ id: inventoryId });

    if (!result.affected) {
      throw new NotFoundException('Inventory not found');
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as {
        code?: string;
      };

      if (driverError.code === '23505') {
        throw new ConflictException(
          'Inventory already exists for this product',
        );
      }

      if (driverError.code === '23503') {
        throw new BadRequestException(
          'Product does not exist in this restaurant',
        );
      }

      if (driverError.code === '23514') {
        throw new BadRequestException(
          'Inventory quantity and threshold must not be negative',
        );
      }
    }

    throw error;
  }
}
