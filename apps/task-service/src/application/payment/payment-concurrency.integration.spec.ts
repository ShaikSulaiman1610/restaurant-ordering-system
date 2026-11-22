
import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RestaurantProvisioningService } from '../restaurant/restaurant-provisioning.service';
import { PaymentService } from './payment.service';
import { OrderService } from '../order/order.service';
import { SimulatedPaymentResult } from './dto/create-payment.dto';

import {
  Order,
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import {
  Payment,
  PaymentStatus,
} from '../../infrastructure/database/entities/payment/payment.entity';
import { Category } from '../../infrastructure/database/entities/category/category.entity';
import { Product } from '../../infrastructure/database/entities/product/product.entity';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import { OrderItem } from '../../infrastructure/database/entities/order/order-item.entity';

config({ quiet: true });

const integrationEnabled =
  process.env.RUN_DB_INTEGRATION_TESTS === 'true';

const describeIntegration = integrationEnabled
  ? describe
  : describe.skip;

describeIntegration('Payment Concurrency Integration', () => {
  jest.setTimeout(60000);

  let provisioningService: RestaurantProvisioningService;
  let databaseName: string;
  let tenantConnection: DataSource;
  let paymentService: PaymentService;
  let orderService: OrderService;
  let databaseProvisioned = false;

  const tenantId = randomUUID();

  beforeAll(async () => {
    if (process.env.DB_REGISTRY_NAME !== 'restaurant_registry') {
      throw new Error('Integration test requires restaurant_registry');
    }

    const configService = new ConfigService();

    provisioningService = new RestaurantProvisioningService(
      configService,
    );

    databaseName = provisioningService.generateDatabaseName();

    await provisioningService.provisionDatabase(databaseName);
    databaseProvisioned = true;

    tenantConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: databaseName,
      entities: [
        Category,
        Product,
        Inventory,
        Order,
        OrderItem,
        Payment,
      ],
      synchronize: false,
      extra: {
        max: 5,
        connectionTimeoutMillis: 5000,
      },
    });

    await tenantConnection.initialize();

    const mockTenantConnectionService = {
      getConnection: jest.fn().mockImplementation(async (id: string) => {
        if (id !== tenantId) {
          throw new Error('Unexpected tenant ID');
        }

        return tenantConnection;
      }),
    };

    paymentService = new PaymentService(
      mockTenantConnectionService as any,
    );

    orderService = new OrderService(
      mockTenantConnectionService as any,
    );
  });

  afterAll(async () => {
    try {
      if (tenantConnection?.isInitialized) {
        await tenantConnection.destroy();
      }
    } finally {
      if (databaseProvisioned) {
        await provisioningService.cleanupDatabase(databaseName);
      }
    }
  });

  it('allows only one successful payment for concurrent requests', async () => {
    const order = await tenantConnection.getRepository(Order).save({
      customerName: 'Concurrency Test Customer',
      customerPhone: null,
      totalAmount: '180.00',
      status: OrderStatus.PENDING,
    });

    const attempts = await Promise.allSettled([
      paymentService.create(tenantId, {
        orderId: order.id,
        transactionReference: `TXN-${randomUUID()}`,
        result: SimulatedPaymentResult.SUCCESS,
      }),
      paymentService.create(tenantId, {
        orderId: order.id,
        transactionReference: `TXN-${randomUUID()}`,
        result: SimulatedPaymentResult.SUCCESS,
      }),
    ]);

    const successful = attempts.filter(
      (result) => result.status === 'fulfilled',
    );

    const rejected = attempts.filter(
      (result) => result.status === 'rejected',
    );

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const paidPayments = await tenantConnection
      .getRepository(Payment)
      .findBy({
        orderId: order.id,
        status: PaymentStatus.PAID,
      });

    expect(paidPayments).toHaveLength(1);

    const rejection = rejected[0];

    if (rejection.status === 'rejected') {
      expect(rejection.reason).toBeInstanceOf(ConflictException);
    }
  });

  it('keeps payment and inventory consistent during concurrent payment and cancellation', async () => {
    const category = await tenantConnection
      .getRepository(Category)
      .save({
        name: `Concurrency Category ${randomUUID().slice(0, 8)}`,
      });

    const product = await tenantConnection
      .getRepository(Product)
      .save({
        name: 'Concurrency Test Product',
        description: 'Test product',
        price: '180.00',
        categoryId: category.id,
        isAvailable: true,
      });

    const inventory = await tenantConnection
      .getRepository(Inventory)
      .save({
        productId: product.id,
        quantity: 10,
        lowStockThreshold: 2,
      });

    const order = await orderService.create(tenantId, {
      customerName: 'Payment Cancellation Race Test',
      items: [
        {
          productId: product.id,
          quantity: 2,
        },
      ],
    });

    const results = await Promise.allSettled([
      paymentService.create(tenantId, {
        orderId: order.id,
        transactionReference: `TXN-${randomUUID()}`,
        result: SimulatedPaymentResult.SUCCESS,
      }),
      orderService.updateStatus(tenantId, order.id, {
        status: OrderStatus.CANCELLED,
      }),
    ]);

    const successful = results.filter(
      (result) => result.status === 'fulfilled',
    );

    const rejected = results.filter(
      (result) => result.status === 'rejected',
    );

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const savedOrder = await tenantConnection
      .getRepository(Order)
      .findOneByOrFail({ id: order.id });

    const paidPayments = await tenantConnection
      .getRepository(Payment)
      .findBy({
        orderId: order.id,
        status: PaymentStatus.PAID,
      });

    const savedInventory = await tenantConnection
      .getRepository(Inventory)
      .findOneByOrFail({ id: inventory.id });

    if (savedOrder.status === OrderStatus.CANCELLED) {
      expect(paidPayments).toHaveLength(0);
      expect(savedInventory.quantity).toBe(10);
    } else {
      expect(savedOrder.status).toBe(OrderStatus.PENDING);
      expect(paidPayments).toHaveLength(1);
      expect(savedInventory.quantity).toBe(8);
    }

    const rejection = rejected[0];

    if (rejection.status === 'rejected') {
      expect(rejection.reason).toBeInstanceOf(ConflictException);
    }
  });
});
