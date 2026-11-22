
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { OrderService } from './order.service';
import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';

import {
  Order,
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import { OrderItem } from '../../infrastructure/database/entities/order/order-item.entity';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import {
  Payment,
  PaymentStatus,
} from '../../infrastructure/database/entities/payment/payment.entity';

describe('OrderService - Status Management', () => {
  let service: OrderService;

  const tenantId = 'd6570f55-1a96-4f3d-a408-e1f99a49a7c7';
  const orderId = '407ca05e-e388-49f1-beb2-72c1ce86a1b2';
  const productId = '901d345d-5c24-4022-945c-77c9032c4bb1';

  let order: Order;
  let inventory: Inventory;

  const orderQueryBuilder = {
    setLock: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn(),
  };

  const inventoryQueryBuilder = {
    setLock: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn(),
  };

  const orderRepository = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  };

  const orderItemRepository = {
    find: jest.fn(),
  };

  const inventoryRepository = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
  };

  const paymentRepository = {
    findOneBy: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const tenantConnectionService = {
    getConnection: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    order = {
      id: orderId,
      customerName: 'Test Customer',
      customerPhone: null,
      totalAmount: '360.00',
      status: OrderStatus.PENDING,
    } as Order;

    inventory = {
      productId,
      quantity: 45,
      lowStockThreshold: 10,
    } as Inventory;

    orderQueryBuilder.setLock.mockReturnValue(orderQueryBuilder);
    orderQueryBuilder.where.mockReturnValue(orderQueryBuilder);
    orderQueryBuilder.getOne.mockImplementation(async () => order);

    inventoryQueryBuilder.setLock.mockReturnValue(
      inventoryQueryBuilder,
    );
    inventoryQueryBuilder.where.mockReturnValue(
      inventoryQueryBuilder,
    );
    inventoryQueryBuilder.getOne.mockImplementation(
      async () => inventory,
    );

    orderRepository.createQueryBuilder.mockReturnValue(
      orderQueryBuilder,
    );

    orderRepository.save.mockImplementation(async (value) => value);

    orderItemRepository.find.mockResolvedValue([
      {
        orderId,
        productId,
        quantity: 2,
      },
    ]);

    inventoryRepository.createQueryBuilder.mockReturnValue(
      inventoryQueryBuilder,
    );

    inventoryRepository.save.mockImplementation(
      async (value) => value,
    );

    paymentRepository.findOneBy.mockResolvedValue(null);

    manager.getRepository.mockImplementation((entity) => {
      if (entity === Order) return orderRepository;
      if (entity === OrderItem) return orderItemRepository;
      if (entity === Inventory) return inventoryRepository;
      if (entity === Payment) return paymentRepository;

      throw new Error('Unexpected entity');
    });

    dataSource.transaction.mockImplementation(
      async (callback) => callback(manager),
    );

    tenantConnectionService.getConnection.mockResolvedValue(
      dataSource,
    );

    service = new OrderService(
      tenantConnectionService as unknown as TenantConnectionService,
    );
  });

  it('confirms a pending order', async () => {
    const result = await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CONFIRMED,
    });

    expect(result.status).toBe(OrderStatus.CONFIRMED);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
  });

  it('moves a confirmed order to preparing', async () => {
    order.status = OrderStatus.CONFIRMED;

    const result = await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.PREPARING,
    });

    expect(result.status).toBe(OrderStatus.PREPARING);
  });

  it('completes a preparing order', async () => {
    order.status = OrderStatus.PREPARING;

    const result = await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.COMPLETED,
    });

    expect(result.status).toBe(OrderStatus.COMPLETED);
  });

  it('rejects skipping order statuses', async () => {
    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.COMPLETED,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects changes to completed orders', async () => {
    order.status = OrderStatus.COMPLETED;

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.PENDING,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects changes to cancelled orders', async () => {
    order.status = OrderStatus.CANCELLED;

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.CANCELLED,
      }),
    ).rejects.toThrow(ConflictException);

    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('restores inventory when cancelling an unpaid order', async () => {
    const result = await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CANCELLED,
    });

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(inventory.quantity).toBe(47);

    expect(inventoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        productId,
        quantity: 47,
      }),
    );
  });

  it('allows cancelling a confirmed unpaid order', async () => {
    order.status = OrderStatus.CONFIRMED;

    const result = await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CANCELLED,
    });

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(inventory.quantity).toBe(47);
  });

  it('rejects cancelling a paid order', async () => {
    paymentRepository.findOneBy.mockResolvedValue({
      orderId,
      status: PaymentStatus.PAID,
    });

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.CANCELLED,
      }),
    ).rejects.toThrow(ConflictException);

    expect(inventoryRepository.save).not.toHaveBeenCalled();
    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects cancellation when inventory is missing', async () => {
    inventoryQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.CANCELLED,
      }),
    ).rejects.toThrow(ConflictException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects inventory quantity overflow', async () => {
    inventory.quantity = Number.MAX_SAFE_INTEGER;

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.CANCELLED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(orderRepository.save).not.toHaveBeenCalled();
  });

  it('throws 404 when order does not exist', async () => {
    orderQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.updateStatus(tenantId, orderId, {
        status: OrderStatus.CONFIRMED,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('locks the order before changing its status', async () => {
    await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CONFIRMED,
    });

    expect(orderQueryBuilder.setLock).toHaveBeenCalledWith(
      'pessimistic_write',
    );
  });

  it('uses a database transaction for status changes', async () => {
    await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CONFIRMED,
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('uses the correct tenant connection', async () => {
    await service.updateStatus(tenantId, orderId, {
      status: OrderStatus.CONFIRMED,
    });

    expect(
      tenantConnectionService.getConnection,
    ).toHaveBeenCalledWith(tenantId);
  });
});
