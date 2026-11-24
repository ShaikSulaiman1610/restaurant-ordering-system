
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { OrderStatus } from '../../../infrastructure/database/entities/order/order.entity.js';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New status of the restaurant order',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
