
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { OrderService } from './order.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Product } from '../../infrastructure/database/entities/product/product.entity';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import {
  Order,
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import { OrderItem } from '../../infrastructure/database/entities/order/order-item.entity';

describe('OrderService', () => {
  let service: OrderService;

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const tenantBId = '0f8d16b9-2e6c-43f3-8b44-ae3e07767d4e';
  const productId = '901d345d-5c24-4022-945c-77c9032c4bb1';
  const orderId = '407ca05e-e388-49f1-beb2-72c1ce86a1b2';

  const product = {
    id: productId,
    name: 'Chicken 65',
    price: '180.00',
    isAvailable: true,
  };

  const order = {
    id: orderId,
    customerName: 'Test Customer',
    customerPhone: null,
    totalAmount: '360.00',
    status: OrderStatus.PENDING,
  };

  const productRepository = {
    findOneBy: jest.fn(),
  };

  const inventoryRepository = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  };

  const orderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  const orderItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const queryBuilder = {
    setLock: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  const tenantConnectionService = {
    getConnection: jest.fn(),
  };

  const createDto = () => ({
    customerName: 'Test Customer',
    items: [{ productId, quantity: 2 }],
  });

  beforeEach(() => {
    jest.resetAllMocks();

    const inventory = {
      productId,
      quantity: 50,
      lowStockThreshold: 10,
    };

    manager.getRepository.mockImplementation((entity) => {
      if (entity === Product) return productRepository;
      if (entity === Inventory) return inventoryRepository;
      if (entity === Order) return orderRepository;
      if (entity === OrderItem) return orderItemRepository;

      throw new Error('Unexpected entity');
    });

    dataSource.getRepository.mockImplementation((entity) => {
      if (entity === Order) return orderRepository;

      throw new Error('Unexpected entity');
    });

    dataSource.transaction.mockImplementation(
      async (callback) => callback(manager),
    );

    tenantConnectionService.getConnection.mockResolvedValue(dataSource);

    productRepository.findOneBy.mockResolvedValue({ ...product });

    inventoryRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.setLock.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.getOne.mockResolvedValue(inventory);

    inventoryRepository.save.mockImplementation(async (value) => value);

    orderRepository.create.mockImplementation((value) => value);
    orderRepository.save.mockImplementation(async (value) => ({
      id: orderId,
      ...value,
    }));

    orderItemRepository.create.mockImplementation((value) => value);
    orderItemRepository.save.mockImplementation(async (value) => value);

    service = new OrderService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('creates an order successfully', async () => {
    const result = await service.create(tenantId, createDto());

    expect(result.id).toBe(orderId);
    expect(result.totalAmount).toBe('360.00');
    expect(result.status).toBe(OrderStatus.PENDING);

    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(orderItemRepository.save).toHaveBeenCalledTimes(1);
  });

  it('deducts inventory when creating an order', async () => {
    await service.create(tenantId, createDto());

    expect(inventoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        productId,
        quantity: 48,
      }),
    );
  });

  it('uses a database transaction', async () => {
    await service.create(tenantId, createDto());

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('locks inventory before deducting stock', async () => {
    await service.create(tenantId, createDto());

    expect(queryBuilder.setLock).toHaveBeenCalledWith(
      'pessimistic_write',
    );
  });

  it('rejects an order with insufficient stock', async () => {
    queryBuilder.getOne.mockResolvedValue({
      productId,
      quantity: 1,
    });

    await expect(
      service.create(tenantId, createDto()),
    ).rejects.toThrow(ConflictException);

    expect(inventoryRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a nonexistent product', async () => {
    productRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(tenantId, createDto()),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an unavailable product', async () => {
    productRepository.findOneBy.mockResolvedValue({
      ...product,
      isAvailable: false,
    });

    await expect(
      service.create(tenantId, createDto()),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a product without inventory', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.create(tenantId, createDto()),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('combines duplicate products into one order item', async () => {
    const result = await service.create(tenantId, {
      customerName: 'Test Customer',
      items: [
        { productId, quantity: 2 },
        { productId, quantity: 3 },
      ],
    });

    expect(result.totalAmount).toBe('900.00');

    expect(inventoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 45 }),
    );

    expect(orderItemRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        productId,
        quantity: 5,
        subtotal: '900.00',
      }),
    ]);
  });

  it('rejects an invalid product price', async () => {
    productRepository.findOneBy.mockResolvedValue({
      ...product,
      price: 'invalid',
    });

    await expect(
      service.create(tenantId, createDto()),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('retrieves all orders', async () => {
    orderRepository.find.mockResolvedValue([{ ...order }]);

    const result = await service.findAll(tenantId);

    expect(result).toHaveLength(1);
    expect(orderRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('retrieves one order', async () => {
    orderRepository.findOneBy.mockResolvedValue({ ...order });

    const result = await service.findOne(tenantId, orderId);

    expect(result.id).toBe(orderId);
    expect(result.totalAmount).toBe('360.00');
  });

  it('throws 404 when an order is missing', async () => {
    orderRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findOne(tenantId, orderId),
    ).rejects.toThrow(NotFoundException);
  });

  it('uses the requested tenant connection', async () => {
    orderRepository.find.mockResolvedValue([]);

    await service.findAll(tenantId);

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });

  it('uses separate connections for different tenants', async () => {
    const tenantARepository = {
      find: jest.fn().mockResolvedValue([{ ...order }]),
    };

    const tenantBRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const tenantAConnection = {
      getRepository: jest.fn().mockReturnValue(tenantARepository),
    };

    const tenantBConnection = {
      getRepository: jest.fn().mockReturnValue(tenantBRepository),
    };

    tenantConnectionService.getConnection.mockImplementation(
      async (id: string) => {
        if (id === tenantId) return tenantAConnection;
        if (id === tenantBId) return tenantBConnection;

        throw new Error('Unknown tenant');
      },
    );

    const ordersA = await service.findAll(tenantId);
    const ordersB = await service.findAll(tenantBId);

    expect(ordersA).toHaveLength(1);
    expect(ordersB).toHaveLength(0);
  });
});
