
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process a simulated payment',
    description:
      'Processes a simulated successful or failed payment for an existing restaurant order. The amount is taken from the order.',
  })
  @ApiCreatedResponse({
    description: 'Payment attempt recorded successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment request or order amount.',
  })
  @ApiConflictResponse({
    description: 'Duplicate transaction or order already paid.',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant or order not found.',
  })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create(tenantId, dto);
  }

  @Get('orders/:orderId')
  @ApiOperation({
    summary: 'Get payment history for an order',
    description:
      'Returns payment attempts belonging to the specified restaurant order.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Unique order ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Payment history retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant or order not found.',
  })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentService.findAll(tenantId, orderId);
  }

  @Get(':paymentId')
  @ApiOperation({
    summary: 'Get payment details by ID',
    description:
      'Retrieves a payment from the specified restaurant database.',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'Unique payment ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Payment retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Restaurant or payment not found.',
  })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentService.findOne(tenantId, paymentId);
  }
}
