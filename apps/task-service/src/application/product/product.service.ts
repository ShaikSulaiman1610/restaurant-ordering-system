
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Category } from '../../infrastructure/database/entities/category/category.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  private async validateCategory(
    dataSource: DataSource,
    categoryId: string,
  ): Promise<void> {
    const category = await dataSource
      .getRepository(Category)
      .findOneBy({ id: categoryId });

    if (!category) {
      throw new BadRequestException(
        'Category does not exist in this restaurant',
      );
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;

      if (code === '23503') {
        throw new BadRequestException(
          'Invalid category reference',
        );
      }

      if (code === '23505') {
        throw new ConflictException(
          'Product already exists',
        );
      }

      if (code === '23514') {
        throw new BadRequestException(
          'Product violates database constraints',
        );
      }
    }

    throw error;
  }

  async create(
    tenantId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    await this.validateCategory(dataSource, dto.categoryId);

    const repository = dataSource.getRepository(Product);

    const product = repository.create({
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      categoryId: dto.categoryId,
      isAvailable: dto.isAvailable ?? true,
      imageUrl: dto.imageUrl ?? null,
    });

    try {
      return await repository.save(product);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(tenantId: string): Promise<Product[]> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    return dataSource.getRepository(Product).find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    tenantId: string,
    productId: string,
  ): Promise<Product> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const product = await dataSource
      .getRepository(Product)
      .findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    tenantId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Product);

    const product = await repository.findOneBy({
      id: productId,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId !== undefined) {
      await this.validateCategory(dataSource, dto.categoryId);
      product.categoryId = dto.categoryId;
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.isAvailable !== undefined) {
      product.isAvailable = dto.isAvailable;
    }

    if (dto.imageUrl !== undefined) {
      product.imageUrl = dto.imageUrl;
    }

    try {
      return await repository.save(product);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(
    tenantId: string,
    productId: string,
  ): Promise<void> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Product);

    try {
      const result = await repository.delete({
        id: productId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('Product not found');
      }
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
