
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { InventoryService } from './inventory.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';

describe('InventoryService', () => {
  let service: InventoryService;

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const tenantBId = '0f8d16b9-2e6c-43f3-8b44-ae3e07767d4e';
  const productId = '901d345d-5c24-4022-945c-77c9032c4bb1';
  const inventoryId = '1e900cfd-2551-4aa2-a83a-e5546237bbaa';

  const inventory: Inventory = {
    id: inventoryId,
    productId,
    product: {} as Product,
    quantity: 50,
    lowStockThreshold: 10,
    createdAt: new Date('2026-11-21T00:00:00Z'),
    updatedAt: new Date('2026-11-21T00:00:00Z'),
  };

  const inventoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const productRepository = {
    findOneBy: jest.fn(),
  };

  const dataSource = {
    getRepository: jest.fn(),
  };

  const tenantConnectionService = {
    getConnection: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    dataSource.getRepository.mockImplementation((entity) => {
      if (entity === Inventory) {
        return inventoryRepository;
      }

      if (entity === Product) {
        return productRepository;
      }

      throw new Error('Unexpected entity');
    });

    tenantConnectionService.getConnection.mockResolvedValue(dataSource);

    productRepository.findOneBy.mockResolvedValue({
      id: productId,
    });

    inventoryRepository.findOneBy.mockResolvedValue(null);

    service = new InventoryService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('creates inventory successfully', async () => {
    const dto = {
      productId,
      quantity: 50,
      lowStockThreshold: 10,
    };

    inventoryRepository.create.mockReturnValue({ ...inventory });
    inventoryRepository.save.mockResolvedValue({ ...inventory });

    const result = await service.create(tenantId, dto);

    expect(result.quantity).toBe(50);
    expect(result.lowStockThreshold).toBe(10);

    expect(productRepository.findOneBy).toHaveBeenCalledWith({
      id: productId,
    });

    expect(inventoryRepository.save).toHaveBeenCalledTimes(1);
  });

  it('uses default low stock threshold of 5', async () => {
    inventoryRepository.create.mockImplementation((value) => value);
    inventoryRepository.save.mockImplementation(async (value) => value);

    const result = await service.create(tenantId, {
      productId,
      quantity: 20,
    });

    expect(result.lowStockThreshold).toBe(5);
  });

  it('rejects inventory for a missing product', async () => {
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(tenantId, {
        productId,
        quantity: 50,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate inventory', async () => {
    inventoryRepository.findOneBy.mockResolvedValue({ ...inventory });

    await expect(
      service.create(tenantId, {
        productId,
        quantity: 100,
      }),
    ).rejects.toThrow(ConflictException);

    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('retrieves all inventories', async () => {
    inventoryRepository.find.mockResolvedValue([{ ...inventory }]);

    const result = await service.findAll(tenantId);

    expect(result).toHaveLength(1);
    expect(inventoryRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('retrieves one inventory', async () => {
    inventoryRepository.findOneBy.mockResolvedValue({ ...inventory });

    const result = await service.findOne(tenantId, inventoryId);

    expect(result.id).toBe(inventoryId);
    expect(result.quantity).toBe(50);
  });

  it('throws 404 when inventory is missing', async () => {
    await expect(
      service.findOne(tenantId, inventoryId),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates inventory quantity', async () => {
    inventoryRepository.findOneBy.mockResolvedValue({ ...inventory });
    inventoryRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, inventoryId, {
      quantity: 35,
    });

    expect(result.quantity).toBe(35);
    expect(result.lowStockThreshold).toBe(10);
  });

  it('updates low stock threshold', async () => {
    inventoryRepository.findOneBy.mockResolvedValue({ ...inventory });
    inventoryRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, inventoryId, {
      lowStockThreshold: 15,
    });

    expect(result.lowStockThreshold).toBe(15);
    expect(result.quantity).toBe(50);
  });

  it('throws 404 when updating missing inventory', async () => {
    await expect(
      service.update(tenantId, inventoryId, {
        quantity: 25,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes inventory successfully', async () => {
    inventoryRepository.delete.mockResolvedValue({
      affected: 1,
    });

    await expect(
      service.remove(tenantId, inventoryId),
    ).resolves.toBeUndefined();

    expect(inventoryRepository.delete).toHaveBeenCalledWith({
      id: inventoryId,
    });
  });

  it('throws 404 when deleting missing inventory', async () => {
    inventoryRepository.delete.mockResolvedValue({
      affected: 0,
    });

    await expect(
      service.remove(tenantId, inventoryId),
    ).rejects.toThrow(NotFoundException);
  });

  it('handles duplicate database error', async () => {
    inventoryRepository.create.mockReturnValue({ ...inventory });

    inventoryRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO inventories',
        [],
        Object.assign(new Error('duplicate'), {
          code: '23505',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        productId,
        quantity: 50,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('handles foreign key database error', async () => {
    inventoryRepository.create.mockReturnValue({ ...inventory });

    inventoryRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO inventories',
        [],
        Object.assign(new Error('foreign key'), {
          code: '23503',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        productId,
        quantity: 50,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('handles check constraint database error', async () => {
    inventoryRepository.create.mockReturnValue({ ...inventory });

    inventoryRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO inventories',
        [],
        Object.assign(new Error('check constraint'), {
          code: '23514',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        productId,
        quantity: 50,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses the requested tenant connection', async () => {
    inventoryRepository.find.mockResolvedValue([]);

    await service.findAll(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });

  it('uses separate connections for different tenants', async () => {
    const tenantADataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([{ ...inventory }]),
      }),
    };

    const tenantBDataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    tenantConnectionService.getConnection.mockImplementation(
      async (id: string) => {
        if (id === tenantId) {
          return tenantADataSource;
        }

        if (id === tenantBId) {
          return tenantBDataSource;
        }

        throw new Error('Unknown tenant');
      },
    );

    const tenantAResult = await service.findAll(tenantId);
    const tenantBResult = await service.findAll(tenantBId);

    expect(tenantAResult).toHaveLength(1);
    expect(tenantBResult).toHaveLength(0);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantBId);
  });
});
