
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Category } from '../../infrastructure/database/entities/category/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Category);

    const category = repository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    try {
      return await repository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Category name already exists',
        );
      }

      throw error;
    }
  }

  async findAll(tenantId: string): Promise<Category[]> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    return dataSource.getRepository(Category).find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    tenantId: string,
    categoryId: string,
  ): Promise<Category> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const category = await dataSource
      .getRepository(Category)
      .findOneBy({ id: categoryId });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    tenantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Category);

    const category = await repository.findOneBy({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    try {
      return await repository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Category name already exists',
        );
      }

      throw error;
    }
  }

  async remove(
    tenantId: string,
    categoryId: string,
  ): Promise<void> {
    const dataSource =
      await this.tenantConnectionService.getConnection(tenantId);

    const repository = dataSource.getRepository(Category);

    const result = await repository.delete({
      id: categoryId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
  }
}
