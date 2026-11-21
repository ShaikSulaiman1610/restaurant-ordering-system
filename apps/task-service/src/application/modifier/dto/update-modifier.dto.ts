
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModifierDto {
  @ApiPropertyOptional({
    description: 'Updated modifier name',
    example: 'Extra Cheese Special',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated modifier description',
    example: 'Add an extra portion of cheese',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Updated additional price as a string, zero or positive, with at most 2 decimal places',
    example: '40.00',
    type: String,
    pattern: '^\\d{1,8}(\\.\\d{1,2})?$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message:
      'additionalPrice must be zero or positive with at most 2 decimal places',
  })
  additionalPrice?: string;

  @ApiPropertyOptional({
    description: 'Updated product ID (UUID)',
    example: '901d345d-5c24-4022-945c-77c9032c4bb1',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Whether the modifier is available',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
