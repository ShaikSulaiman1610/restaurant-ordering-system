
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  SimulatedPaymentResult,
  CreatePaymentDto,
} from './dto/create-payment.dto';
import {
  OrderStatus,
} from '../../infrastructure/database/entities/order/order.entity';
import {
  PaymentStatus,
} from '../../infrastructure/database/entities/payment/payment.entity';

describe('PaymentService', () => {
  let service: PaymentService;

  let orderRepository: any;
  let paymentRepository: any;
  let queryBuilder: any;
  let connection: any;
  let tenantConnectionService: any;

  const tenantId = 'tenant-test-123';

  const order = {
    id: 'order-123',
    totalAmount: '180.00',
    status: OrderStatus.PENDING,
  };

  const successDto: CreatePaymentDto = {
    orderId: 'order-123',
    transactionReference: 'TXN-001',
    result: SimulatedPaymentResult.SUCCESS,
  };

  beforeEach(() => {
    queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ ...order }),
    };

    orderRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneBy: jest.fn().mockResolvedValue({ ...order }),
    };

    paymentRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(async (data) => ({
        id: 'payment-123',
        ...data,
      })),
      find: jest.fn().mockResolvedValue([]),
    };

    connection = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: jest.fn((entity) =>
            entity.name === 'Order'
              ? orderRepository
              : paymentRepository,
          ),
        }),
      ),
      getRepository: jest.fn((entity) =>
        entity.name === 'Order'
          ? orderRepository
          : paymentRepository,
      ),
    };

    tenantConnectionService = {
      getConnection: jest.fn().mockResolvedValue(connection),
    };

    service = new PaymentService(tenantConnectionService);
  });

  it('creates a successful payment', async () => {
    const result = await service.create(tenantId, successDto);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(result.amount).toBe('180.00');
    expect(result.failureReason).toBeNull();
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
  });

  it('creates a failed payment with failure reason', async () => {
    const result = await service.create(tenantId, {
      ...successDto,
      result: SimulatedPaymentResult.FAILURE,
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(result.failureReason).toBe(
      'Simulated payment failure',
    );
  });

  it('returns existing payment for same transaction reference', async () => {
    const existingPayment = {
      id: 'existing-payment',
      orderId: order.id,
      status: PaymentStatus.PAID,
      transactionReference: 'TXN-001',
    };

    paymentRepository.findOneBy.mockResolvedValueOnce(
      existingPayment,
    );

    const result = await service.create(tenantId, successDto);

    expect(result).toEqual(existingPayment);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('rejects transaction reference used for another order', async () => {
    paymentRepository.findOneBy.mockResolvedValueOnce({
      orderId: 'another-order',
      status: PaymentStatus.PAID,
    });

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects another successful payment for a paid order', async () => {
    paymentRepository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        orderId: order.id,
        status: PaymentStatus.PAID,
      });

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow('Order has already been paid');
  });

  it('rejects payment for a cancelled order', async () => {
    queryBuilder.getOne.mockResolvedValueOnce({
      ...order,
      status: OrderStatus.CANCELLED,
    });

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects payment for a completed order', async () => {
    queryBuilder.getOne.mockResolvedValueOnce({
      ...order,
      status: OrderStatus.COMPLETED,
    });

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects invalid payment amount', async () => {
    queryBuilder.getOne.mockResolvedValueOnce({
      ...order,
      totalAmount: '0.00',
    });

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects blank transaction reference', async () => {
    await expect(
      service.create(tenantId, {
        ...successDto,
        transactionReference: '   ',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(
      tenantConnectionService.getConnection,
    ).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for missing order', async () => {
    queryBuilder.getOne.mockResolvedValueOnce(null);

    await expect(
      service.create(tenantId, successDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns payment history in descending order', async () => {
    const payments = [
      { id: 'payment-2', status: PaymentStatus.PAID },
      { id: 'payment-1', status: PaymentStatus.FAILED },
    ];

    paymentRepository.find.mockResolvedValueOnce(payments);

    const result = await service.findAll(
      tenantId,
      order.id,
    );

    expect(result).toEqual(payments);
    expect(paymentRepository.find).toHaveBeenCalledWith({
      where: { orderId: order.id },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns payment by ID', async () => {
    const payment = {
      id: 'payment-123',
      status: PaymentStatus.PAID,
    };

    paymentRepository.findOneBy.mockResolvedValueOnce(
      payment,
    );

    const result = await service.findOne(
      tenantId,
      'payment-123',
    );

    expect(result).toEqual(payment);
  });

  it('throws NotFoundException for missing payment', async () => {
    await expect(
      service.findOne(tenantId, 'missing-payment'),
    ).rejects.toThrow(NotFoundException);
  });
});
