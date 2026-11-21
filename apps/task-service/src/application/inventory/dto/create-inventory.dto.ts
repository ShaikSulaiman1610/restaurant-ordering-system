
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({
    description: 'UUID of the product to track inventory for',
    example: '901d345d-5c24-4022-945c-77c9032c4bb1',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    type: Number,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({
    description:
      'Stock quantity at or below which inventory is considered low',
    example: 10,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}
