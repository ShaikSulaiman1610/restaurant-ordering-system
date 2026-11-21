
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

import { CreateOrderDto } from './dto/create-order.dto';

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
}
