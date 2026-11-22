
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { TenantConnectionService } from '../../infrastructure/database/tenant-connection/tenant-connection.service';
import {
  Order,
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import {
  Payment,
  PaymentStatus,
} from '../../infrastructure/database/entities/payment/payment.entity';

import {
  CreatePaymentDto,
  SimulatedPaymentResult,
} from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(
    tenantId: string,
    dto: CreatePaymentDto,
  ): Promise<Payment> {
    const transactionReference =
      dto.transactionReference?.trim();

    if (!transactionReference) {
      throw new BadRequestException(
        'Transaction reference is required',
      );
    }

    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    try {
      return await connection.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const paymentRepository = manager.getRepository(Payment);

        // Lock the order to serialize payment attempts.
        const order = await orderRepository
          .createQueryBuilder('order')
          .setLock('pessimistic_write')
          .where('order.id = :orderId', {
            orderId: dto.orderId,
          })
          .getOne();

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        // A transaction reference identifies one payment attempt.
        const existingPayment = await paymentRepository.findOneBy({
          transactionReference,
        });

        if (existingPayment) {
          if (
            existingPayment.orderId !== dto.orderId ||
            existingPayment.status === PaymentStatus.PENDING ||
            (dto.result === SimulatedPaymentResult.SUCCESS &&
              existingPayment.status !== PaymentStatus.PAID) ||
            (dto.result === SimulatedPaymentResult.FAILURE &&
              existingPayment.status !== PaymentStatus.FAILED)
          ) {
            throw new ConflictException(
              'Transaction reference already used',
            );
          }

          return existingPayment;
        }

        // Prevent another successful payment for the same order.
        const paidPayment = await paymentRepository.findOneBy({
          orderId: order.id,
          status: PaymentStatus.PAID,
        });

        if (paidPayment) {
          throw new ConflictException(
            'Order has already been paid',
          );
        }

        if (
          order.status === OrderStatus.CANCELLED ||
          order.status === OrderStatus.COMPLETED
        ) {
          throw new ConflictException(
            'Payment is not allowed for this order status',
          );
        }

        if (
          !/^\d{1,10}\.\d{2}$/.test(order.totalAmount) ||
          Number(order.totalAmount) <= 0
        ) {
          throw new BadRequestException(
            'Invalid order payment amount',
          );
        }

        const status =
          dto.result === SimulatedPaymentResult.SUCCESS
            ? PaymentStatus.PAID
            : PaymentStatus.FAILED;

        const payment = paymentRepository.create({
          orderId: order.id,
          amount: order.totalAmount,
          transactionReference,
          status,
          failureReason:
            status === PaymentStatus.FAILED
              ? 'Simulated payment failure'
              : null,
        });

        return paymentRepository.save(payment);
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
        };

        if (driverError.code === '23505') {
          throw new ConflictException(
            'Duplicate payment transaction',
          );
        }
      }

      throw error;
    }
  }

  async findAll(
    tenantId: string,
    orderId: string,
  ): Promise<Payment[]> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const order = await connection
      .getRepository(Order)
      .findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return connection.getRepository(Payment).find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    tenantId: string,
    paymentId: string,
  ): Promise<Payment> {
    const connection =
      await this.tenantConnectionService.getConnection(tenantId);

    const payment = await connection
      .getRepository(Payment)
      .findOneBy({ id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
