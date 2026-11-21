
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Updated product name',
    example: 'Chicken 65 Special',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated product description',
    example: 'Extra spicy fried chicken starter',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Updated product price as a string, greater than zero, with at most 2 decimal places',
    example: '200.00',
    type: String,
    pattern: '^(?=.*[1-9])\\d{1,8}(\\.\\d{1,2})?$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[1-9])\d{1,8}(\.\d{1,2})?$/, {
    message:
      'price must be greater than zero with at most 2 decimal places',
  })
  price?: string;

  @ApiPropertyOptional({
    description: 'Updated category ID (UUID)',
    example: 'a8d0c8a7-0552-4f77-8a18-b72144629ca0',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Whether the product is available for ordering',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Updated product image URL',
    example: 'https://example.com/images/chicken-65-special.jpg',
    format: 'uri',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
}
