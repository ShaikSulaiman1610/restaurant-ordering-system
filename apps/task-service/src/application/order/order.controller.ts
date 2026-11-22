
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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

import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Creates a restaurant order, validates stock, and deducts inventory within a database transaction.',
  })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid order data or nonexistent product.',
  })
  @ApiConflictResponse({
    description: 'Product unavailable or insufficient stock.',
  })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all restaurant orders',
    description:
      'Returns orders belonging to the specified restaurant.',
  })
  @ApiOkResponse({
    description: 'Restaurant orders retrieved successfully.',
  })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return this.orderService.findAll(tenantId);
  }

  @Get(':orderId')
  @ApiOperation({
    summary: 'Get an order by ID',
    description:
      'Retrieves a single order from the specified restaurant.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Unique order ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Order retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found in this restaurant.',
  })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.findOne(tenantId, orderId);
  }

  @Patch(':orderId/status')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Updates the order status using valid transitions. Cancellation restores inventory for unpaid orders.',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Unique order ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Order status updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid order status.',
  })
  @ApiConflictResponse({
    description:
      'Invalid status transition or paid order cancellation.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found in this restaurant.',
  })
  async updateStatus(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(
      tenantId,
      orderId,
      dto,
    );
  }
}
