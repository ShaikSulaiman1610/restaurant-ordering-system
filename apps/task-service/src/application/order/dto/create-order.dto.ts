
import {
  IsArray,
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Unique product ID (UUID)',
    example: '901d345d-5c24-4022-945c-77c9032c4bb1',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Number of units to order (minimum 1)',
    example: 2,
    minimum: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer name',
    example: 'Test Customer',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName!: string;

  @ApiPropertyOptional({
    description: 'Customer contact number',
    example: '9876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @ApiProperty({
    description: 'List of products included in the order',
    type: () => CreateOrderItemDto,
    isArray: true,
    minItems: 1,
    example: [
      {
        productId: '901d345d-5c24-4022-945c-77c9032c4bb1',
        quantity: 2,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
