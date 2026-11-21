
import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto {
  @ApiPropertyOptional({
    description: 'Updated available stock quantity',
    example: 75,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({
    description:
      'Updated low-stock warning threshold',
    example: 15,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}
