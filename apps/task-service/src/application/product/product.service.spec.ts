
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { ProductService } from './product.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Category } from '../../infrastructure/database/entities/category/category.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';
import {
  ListProductsQueryDto,
  ProductSortBy,
  ProductSortOrder,
} from './dto/list-products-query.dto';

describe('ProductService', () => {
  let service: ProductService;

  const productRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const categoryRepository = {
    findOneBy: jest.fn(),
  };

  const dataSource = {
    getRepository: jest.fn(),
  };

  const tenantConnectionService = {
    getConnection: jest.fn(),
  };

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const anotherTenantId = '0f8d16b9-2e6c-43f3-8b44-ae3e07767d4e';
  const categoryId = 'a8d0c8a7-0552-4f77-8a18-b72144629ca0';
  const productId = 'ae8a3855-2c0e-4808-829c-8400e6c5c8f2';

  const product = {
    id: productId,
    name: 'Chicken 65',
    description: 'Spicy chicken starter',
    price: '180.00',
    categoryId,
    isAvailable: true,
    imageUrl: null,
    createdAt: new Date('2026-11-19T00:00:00Z'),
    updatedAt: new Date('2026-11-19T00:00:00Z'),
  } as Product;

  const createDto = {
    name: 'Chicken 65',
    description: 'Spicy chicken starter',
    price: '180.00',
    categoryId,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    dataSource.getRepository.mockImplementation((entity) => {
      if (entity === Product) {
        return productRepository;
      }

      if (entity === Category) {
        return categoryRepository;
      }

      throw new Error('Unexpected repository');
    });

    tenantConnectionService.getConnection.mockResolvedValue(dataSource);

    categoryRepository.findOneBy.mockResolvedValue({
      id: categoryId,
    });

    service = new ProductService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('creates a product successfully', async () => {
    productRepository.create.mockReturnValue({ ...product });
    productRepository.save.mockResolvedValue({ ...product });

    const result = await service.create(tenantId, createDto);

    expect(result.name).toBe('Chicken 65');

    expect(categoryRepository.findOneBy).toHaveBeenCalledWith({
      id: categoryId,
    });

    expect(productRepository.create).toHaveBeenCalledWith({
      name: 'Chicken 65',
      description: 'Spicy chicken starter',
      price: '180.00',
      categoryId,
      isAvailable: true,
      imageUrl: null,
    });

    expect(productRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects a product with a missing category', async () => {
    categoryRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(tenantId, createDto),
    ).rejects.toThrow(BadRequestException);

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('retrieves all products using the previous behavior', async () => {
    productRepository.find.mockResolvedValue([{ ...product }]);

    const result = await service.findAll(tenantId);

    expect(result).toHaveLength(1);

    expect(productRepository.find).toHaveBeenCalledWith({
      order: {
        createdAt: 'DESC',
      },
    });
  });

  it('returns paginated products with default settings', async () => {
    productRepository.findAndCount.mockResolvedValue([
      [{ ...product }],
      21,
    ]);

    const query = new ListProductsQueryDto();

    const result = await service.findAll(tenantId, query);

    expect(result).toEqual({
      data: [{ ...product }],
      total: 21,
      page: 1,
      limit: 10,
      totalPages: 3,
    });

    expect(productRepository.findAndCount).toHaveBeenCalledWith({
      where: {},
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
      skip: 0,
      take: 10,
    });
  });

  it('applies page and limit for pagination', async () => {
    productRepository.findAndCount.mockResolvedValue([[], 25]);

    const query = Object.assign(new ListProductsQueryDto(), {
      page: 3,
      limit: 5,
    });

    const result = await service.findAll(tenantId, query);

    expect(result).toEqual({
      data: [],
      total: 25,
      page: 3,
      limit: 5,
      totalPages: 5,
    });

    expect(productRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    );
  });

  it('filters products by category and availability', async () => {
    productRepository.findAndCount.mockResolvedValue([
      [{ ...product }],
      1,
    ]);

    const query = Object.assign(new ListProductsQueryDto(), {
      categoryId,
      isAvailable: true,
    });

    await service.findAll(tenantId, query);

    expect(productRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId,
          isAvailable: true,
        },
      }),
    );
  });

  it('filters unavailable products correctly', async () => {
    productRepository.findAndCount.mockResolvedValue([[], 0]);

    const query = Object.assign(new ListProductsQueryDto(), {
      isAvailable: false,
    });

    await service.findAll(tenantId, query);

    expect(productRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isAvailable: false,
        },
      }),
    );
  });

  it('sorts products by price ascending', async () => {
    productRepository.findAndCount.mockResolvedValue([
      [{ ...product }],
      1,
    ]);

    const query = Object.assign(new ListProductsQueryDto(), {
      sortBy: ProductSortBy.PRICE,
      sortOrder: ProductSortOrder.ASC,
    });

    await service.findAll(tenantId, query);

    expect(productRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: {
          price: 'ASC',
          id: 'ASC',
        },
      }),
    );
  });

  it('sorts products by name descending', async () => {
    productRepository.findAndCount.mockResolvedValue([
      [{ ...product }],
      1,
    ]);

    const query = Object.assign(new ListProductsQueryDto(), {
      sortBy: ProductSortBy.NAME,
      sortOrder: ProductSortOrder.DESC,
    });

    await service.findAll(tenantId, query);

    expect(productRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: {
          name: 'DESC',
          id: 'ASC',
        },
      }),
    );
  });

  it('retrieves one product', async () => {
    productRepository.findOneBy.mockResolvedValue({ ...product });

    const result = await service.findOne(tenantId, productId);

    expect(result.id).toBe(productId);

    expect(productRepository.findOneBy).toHaveBeenCalledWith({
      id: productId,
    });
  });

  it('throws 404 when product is missing', async () => {
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(tenantId, productId),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates product price successfully', async () => {
    productRepository.findOneBy.mockResolvedValue({ ...product });
    productRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, productId, {
      price: '200.00',
    });

    expect(result.price).toBe('200.00');
    expect(result.name).toBe('Chicken 65');
  });

  it('updates product availability successfully', async () => {
    productRepository.findOneBy.mockResolvedValue({ ...product });
    productRepository.save.mockImplementation(async (value) => value);

    const result = await service.update(tenantId, productId, {
      isAvailable: false,
    });

    expect(result.isAvailable).toBe(false);
  });

  it('validates category when updating categoryId', async () => {
    productRepository.findOneBy.mockResolvedValue({ ...product });
    productRepository.save.mockImplementation(async (value) => value);

    const newCategoryId = '00000000-0000-4000-8000-000000000002';

    await service.update(tenantId, productId, {
      categoryId: newCategoryId,
    });

    expect(categoryRepository.findOneBy).toHaveBeenCalledWith({
      id: newCategoryId,
    });
  });

  it('rejects invalid category during update', async () => {
    productRepository.findOneBy.mockResolvedValue({ ...product });
    categoryRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(tenantId, productId, {
        categoryId: '00000000-0000-4000-8000-000000000002',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it('throws 404 when updating missing product', async () => {
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(tenantId, productId, {
        name: 'Updated Chicken 65',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes a product successfully', async () => {
    productRepository.delete.mockResolvedValue({
      affected: 1,
    });

    await expect(
      service.remove(tenantId, productId),
    ).resolves.toBeUndefined();

    expect(productRepository.delete).toHaveBeenCalledWith({
      id: productId,
    });
  });

  it('throws 404 when deleting missing product', async () => {
    productRepository.delete.mockResolvedValue({
      affected: 0,
    });

    await expect(
      service.remove(tenantId, productId),
    ).rejects.toThrow(NotFoundException);
  });

  it('handles duplicate product database error', async () => {
    productRepository.create.mockReturnValue({ ...product });

    const dbError = new QueryFailedError(
      'INSERT INTO products',
      [],
      Object.assign(new Error('Duplicate product'), {
        code: '23505',
      }),
    );

    productRepository.save.mockRejectedValue(dbError);

    await expect(
      service.create(tenantId, createDto),
    ).rejects.toThrow(ConflictException);
  });

  it('handles foreign key database error', async () => {
    productRepository.create.mockReturnValue({ ...product });

    const dbError = new QueryFailedError(
      'INSERT INTO products',
      [],
      Object.assign(new Error('Foreign key violation'), {
        code: '23503',
      }),
    );

    productRepository.save.mockRejectedValue(dbError);

    await expect(
      service.create(tenantId, createDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('handles price check constraint database error', async () => {
    productRepository.create.mockReturnValue({ ...product });

    const dbError = new QueryFailedError(
      'INSERT INTO products',
      [],
      Object.assign(new Error('Price check violation'), {
        code: '23514',
      }),
    );

    productRepository.save.mockRejectedValue(dbError);

    await expect(
      service.create(tenantId, createDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses the requested tenant connection', async () => {
    productRepository.find.mockResolvedValue([]);

    await service.findAll(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });

  it('uses separate connections for different tenants', async () => {
    const tenantADataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([{ ...product }]),
      }),
    };

    const tenantBDataSource = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    tenantConnectionService.getConnection.mockImplementation(
      async (requestedTenantId: string) => {
        if (requestedTenantId === tenantId) {
          return tenantADataSource;
        }

        if (requestedTenantId === anotherTenantId) {
          return tenantBDataSource;
        }

        throw new Error('Unknown tenant');
      },
    );

    const restaurantAProducts = await service.findAll(tenantId);
    const restaurantBProducts = await service.findAll(anotherTenantId);

    expect(restaurantAProducts).toHaveLength(1);
    expect(restaurantBProducts).toHaveLength(0);

    expect(tenantADataSource.getRepository).toHaveBeenCalledWith(Product);
    expect(tenantBDataSource.getRepository).toHaveBeenCalledWith(Product);
  });
});
