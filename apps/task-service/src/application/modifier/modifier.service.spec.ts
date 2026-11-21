
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { ModifierService } from './modifier.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Modifier } from '../../infrastructure/database/entities/modifier/modifier.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';

describe('ModifierService', () => {
  let service: ModifierService;

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const tenantBId = '0f8d16b9-2e6c-43f3-8b44-ae3e07767d4e';
  const productId = '901d345d-5c24-4022-945c-77c9032c4bb1';
  const modifierId = '05c7133c-51c2-4b72-b508-a9049d60f9ef';

  const modifier: Modifier = {
    id: modifierId,
    name: 'Extra Sauce',
    description: 'Additional spicy sauce',
    additionalPrice: '20.00',
    productId,
    product: {} as Product,
    isAvailable: true,
    createdAt: new Date('2026-11-21T00:00:00Z'),
    updatedAt: new Date('2026-11-21T00:00:00Z'),
  };

  const modifierRepository = {
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
      if (entity === Modifier) {
        return modifierRepository;
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

    service = new ModifierService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('creates a modifier successfully', async () => {
    const dto = {
      name: 'Extra Sauce',
      description: 'Additional spicy sauce',
      additionalPrice: '20.00',
      productId,
    };

    modifierRepository.create.mockReturnValue({ ...modifier });
    modifierRepository.save.mockResolvedValue({ ...modifier });

    const result = await service.create(tenantId, dto);

    expect(result.name).toBe('Extra Sauce');
    expect(modifierRepository.save).toHaveBeenCalledTimes(1);
    expect(productRepository.findOneBy).toHaveBeenCalledWith({
      id: productId,
    });
  });

  it('rejects a modifier with a missing product', async () => {
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(tenantId, {
        name: 'Extra Sauce',
        additionalPrice: '20.00',
        productId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(modifierRepository.save).not.toHaveBeenCalled();
  });

  it('retrieves all modifiers', async () => {
    modifierRepository.find.mockResolvedValue([{ ...modifier }]);

    const result = await service.findAll(tenantId);

    expect(result).toHaveLength(1);
    expect(modifierRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('retrieves one modifier', async () => {
    modifierRepository.findOneBy.mockResolvedValue({ ...modifier });

    const result = await service.findOne(tenantId, modifierId);

    expect(result.id).toBe(modifierId);
  });

  it('throws 404 when modifier is missing', async () => {
    modifierRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(tenantId, modifierId),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates modifier price successfully', async () => {
    modifierRepository.findOneBy.mockResolvedValue({ ...modifier });
    modifierRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, modifierId, {
      additionalPrice: '30.00',
    });

    expect(result.additionalPrice).toBe('30.00');
    expect(result.name).toBe('Extra Sauce');
  });

  it('updates modifier availability', async () => {
    modifierRepository.findOneBy.mockResolvedValue({ ...modifier });
    modifierRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, modifierId, {
      isAvailable: false,
    });

    expect(result.isAvailable).toBe(false);
  });

  it('validates product when updating productId', async () => {
    const newProductId = '00000000-0000-4000-8000-000000000002';

    modifierRepository.findOneBy.mockResolvedValue({ ...modifier });
    modifierRepository.save.mockImplementation(async (value) => value);
    productRepository.findOneBy.mockResolvedValue({
      id: newProductId,
    });

    const result = await service.update(tenantId, modifierId, {
      productId: newProductId,
    });

    expect(result.productId).toBe(newProductId);
    expect(productRepository.findOneBy).toHaveBeenCalledWith({
      id: newProductId,
    });
  });

  it('rejects invalid product during update', async () => {
    modifierRepository.findOneBy.mockResolvedValue({ ...modifier });
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(tenantId, modifierId, {
        productId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws 404 when updating missing modifier', async () => {
    modifierRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(tenantId, modifierId, {
        name: 'Extra Cheese',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes a modifier successfully', async () => {
    modifierRepository.delete.mockResolvedValue({
      affected: 1,
    });

    await expect(
      service.remove(tenantId, modifierId),
    ).resolves.toBeUndefined();

    expect(modifierRepository.delete).toHaveBeenCalledWith({
      id: modifierId,
    });
  });

  it('throws 404 when deleting missing modifier', async () => {
    modifierRepository.delete.mockResolvedValue({
      affected: 0,
    });

    await expect(
      service.remove(tenantId, modifierId),
    ).rejects.toThrow(NotFoundException);
  });

  it('handles duplicate modifier database error', async () => {
    modifierRepository.create.mockReturnValue({ ...modifier });

    modifierRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO modifiers',
        [],
        Object.assign(new Error('duplicate'), {
          code: '23505',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        name: 'Extra Sauce',
        additionalPrice: '20.00',
        productId,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('handles foreign key database error', async () => {
    modifierRepository.create.mockReturnValue({ ...modifier });

    modifierRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO modifiers',
        [],
        Object.assign(new Error('foreign key'), {
          code: '23503',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        name: 'Extra Sauce',
        additionalPrice: '20.00',
        productId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('handles price check constraint database error', async () => {
    modifierRepository.create.mockReturnValue({ ...modifier });

    modifierRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO modifiers',
        [],
        Object.assign(new Error('check constraint'), {
          code: '23514',
        }),
      ),
    );

    await expect(
      service.create(tenantId, {
        name: 'Extra Sauce',
        additionalPrice: '20.00',
        productId,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses the requested tenant connection', async () => {
    modifierRepository.find.mockResolvedValue([]);

    await service.findAll(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });

  it('uses separate connections for different tenants', async () => {
    const tenantADataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([{ ...modifier }]),
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
