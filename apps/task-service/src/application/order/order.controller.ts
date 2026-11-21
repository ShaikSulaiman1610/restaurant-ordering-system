
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

import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('tenants/:tenantId/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return this.orderService.findAll(tenantId);
  }

  @Get(':orderId')
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.findOne(tenantId, orderId);
  }
}
