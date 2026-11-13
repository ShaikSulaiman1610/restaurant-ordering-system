
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { CategoryService } from './category.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Category } from '../../infrastructure/database/entities/category/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;

  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const dataSource = {
    getRepository: jest.fn().mockReturnValue(repository),
  };

  const tenantConnectionService = {
    getConnection: jest.fn().mockResolvedValue(dataSource),
  };

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const categoryId = 'a8d0c8a7-0552-4f77-8a18-b72144629ca0';

  const category: Category = {
    id: categoryId,
    name: 'Starters',
    description: 'Starter dishes',
    createdAt: new Date('2026-11-13T00:00:00Z'),
    updatedAt: new Date('2026-11-13T00:00:00Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    dataSource.getRepository.mockReturnValue(repository);
    tenantConnectionService.getConnection.mockResolvedValue(dataSource);

    service = new CategoryService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('creates a category successfully', async () => {
    const dto = {
      name: 'Starters',
      description: 'Starter dishes',
    };

    repository.create.mockReturnValue({ ...category });
    repository.save.mockResolvedValue({ ...category });

    const result = await service.create(tenantId, dto);

    expect(result.name).toBe('Starters');
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('retrieves all categories', async () => {
    repository.find.mockResolvedValue([{ ...category }]);

    const result = await service.findAll(tenantId);

    expect(result).toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('retrieves one category', async () => {
    repository.findOneBy.mockResolvedValue({ ...category });

    const result = await service.findOne(tenantId, categoryId);

    expect(result.id).toBe(categoryId);
  });

  it('throws 404 when category is missing', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(tenantId, categoryId),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates category name successfully', async () => {
    repository.findOneBy.mockResolvedValue({ ...category });
    repository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, categoryId, {
      name: 'Hot Starters',
    });

    expect(result.name).toBe('Hot Starters');
    expect(result.description).toBe('Starter dishes');
  });

  it('throws 404 when updating missing category', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(tenantId, categoryId, {
        name: 'Hot Starters',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws 409 when updating to duplicate name', async () => {
    repository.findOneBy.mockResolvedValue({ ...category });

    const dbError = new QueryFailedError(
      'UPDATE categories SET name = $1',
      ['Hot Starters'],
      { code: '23505' },
    );

    repository.save.mockRejectedValue(dbError);

    await expect(
      service.update(tenantId, categoryId, {
        name: 'Hot Starters',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('deletes a category successfully', async () => {
    repository.delete.mockResolvedValue({ affected: 1 });

    await expect(
      service.remove(tenantId, categoryId),
    ).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledWith({
      id: categoryId,
    });
  });

  it('throws 404 when deleting missing category', async () => {
    repository.delete.mockResolvedValue({ affected: 0 });

    await expect(
      service.remove(tenantId, categoryId),
    ).rejects.toThrow(NotFoundException);
  });

  it('uses the requested tenant connection', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAll(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });
});
