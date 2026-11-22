
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import { Product } from '../../infrastructure/database/entities/product/product.entity';
import { Inventory } from '../../infrastructure/database/entities/inventory/inventory.entity';
import {
  Order,
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import { OrderItem } from '../../infrastructure/database/entities/order/order-item.entity';
import {
  Payment,
  PaymentStatus,
} from '../../infrastructure/database/entities/payment/payment.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateOrderDto,
  ): Promise<Order> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    return connection.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const inventoryRepository = manager.getRepository(Inventory);
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);

      const quantities = new Map<string, number>();

      for (const item of dto.items) {
        const currentQuantity = quantities.get(item.productId) ?? 0;

        const totalQuantity = currentQuantity + item.quantity;

        if (!Number.isSafeInteger(totalQuantity)) {
          throw new BadRequestException('Invalid order quantity');
        }

        quantities.set(item.productId, totalQuantity);
      }

      const productIds = [...quantities.keys()].sort();

      let totalAmountInCents = 0;

      const orderItems: Array<{
        productId: string;
        quantity: number;
        unitPrice: string;
        subtotal: string;
      }> = [];

      for (const productId of productIds) {
        const quantity = quantities.get(productId)!;

        const product = await productRepository.findOneBy({
          id: productId,
        });

        if (!product) {
          throw new BadRequestException(
            'Product does not exist in this restaurant',
          );
        }

        if (!product.isAvailable) {
          throw new ConflictException(
            `Product ${product.name} is not available`,
          );
        }

        const inventory = await inventoryRepository
          .createQueryBuilder('inventory')
          .setLock('pessimistic_write')
          .where('inventory.productId = :productId', {
            productId,
          })
          .getOne();

        if (!inventory) {
          throw new ConflictException(
            `Inventory not found for product ${product.name}`,
          );
        }

        if (inventory.quantity < quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}`,
          );
        }

        const price = product.price;

        if (!/^\d{1,8}\.\d{2}$/.test(price)) {
          throw new BadRequestException(
            'Invalid product price',
          );
        }

        const [whole, fractional] = price.split('.');

        const unitPriceInCents =
          Number(whole) * 100 + Number(fractional);

        const subtotalInCents =
          unitPriceInCents * quantity;

        if (!Number.isSafeInteger(subtotalInCents)) {
          throw new BadRequestException(
            'Order amount exceeds supported range',
          );
        }

        totalAmountInCents += subtotalInCents;

        if (
          !Number.isSafeInteger(totalAmountInCents) ||
          totalAmountInCents > 999999999999
        ) {
          throw new BadRequestException(
            'Order total exceeds supported range',
          );
        }

        inventory.quantity -= quantity;

        await inventoryRepository.save(inventory);

        orderItems.push({
          productId,
          quantity,
          unitPrice: price,
          subtotal: (subtotalInCents / 100).toFixed(2),
        });
      }

      const order = orderRepository.create({
        customerName: dto.customerName,
        customerPhone: dto.customerPhone ?? null,
        totalAmount: (totalAmountInCents / 100).toFixed(2),
        status: OrderStatus.PENDING,
      });

      const savedOrder = await orderRepository.save(order);

      const items = orderItems.map((item) =>
        orderItemRepository.create({
          orderId: savedOrder.id,
          ...item,
        }),
      );

      await orderItemRepository.save(items);

      return savedOrder;
    });
  }

  async findAll(tenantId: string): Promise<Order[]> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    return connection.getRepository(Order).find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    tenantId: string,
    orderId: string,
  ): Promise<Order> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const order = await connection
      .getRepository(Order)
      .findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    return connection.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);
      const inventoryRepository = manager.getRepository(Inventory);
      const paymentRepository = manager.getRepository(Payment);

      // Lock the order to prevent concurrent status changes.
      const order = await orderRepository
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :orderId', { orderId })
        .getOne();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const allowedTransitions: Record<
        OrderStatus,
        OrderStatus[]
      > = {
        [OrderStatus.PENDING]: [
          OrderStatus.CONFIRMED,
          OrderStatus.CANCELLED,
        ],
        [OrderStatus.CONFIRMED]: [
          OrderStatus.PREPARING,
          OrderStatus.CANCELLED,
        ],
        [OrderStatus.PREPARING]: [
          OrderStatus.COMPLETED,
        ],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
      };

      const allowedStatuses = allowedTransitions[order.status];

      if (!allowedStatuses?.includes(dto.status)) {
        throw new ConflictException(
          `Cannot change order status from ${order.status} to ${dto.status}`,
        );
      }

      if (dto.status === OrderStatus.CANCELLED) {
        // Paid orders need refund handling before cancellation.
        const paidPayment = await paymentRepository.findOneBy({
          orderId: order.id,
          status: PaymentStatus.PAID,
        });

        if (paidPayment) {
          throw new ConflictException(
            'Paid orders cannot be cancelled without refund handling',
          );
        }

        const orderItems = await orderItemRepository.find({
          where: { orderId: order.id },
          order: { productId: 'ASC' },
        });

        for (const item of orderItems) {
          const inventory = await inventoryRepository
            .createQueryBuilder('inventory')
            .setLock('pessimistic_write')
            .where('inventory.productId = :productId', {
              productId: item.productId,
            })
            .getOne();

          if (!inventory) {
            throw new ConflictException(
              'Inventory not found during order cancellation',
            );
          }

          const restoredQuantity =
            inventory.quantity + item.quantity;

          if (!Number.isSafeInteger(restoredQuantity)) {
            throw new BadRequestException(
              'Inventory quantity exceeds supported range',
            );
          }

          inventory.quantity = restoredQuantity;

          await inventoryRepository.save(inventory);
        }
      }

      order.status = dto.status;

      return orderRepository.save(order);
    });
  }
}
