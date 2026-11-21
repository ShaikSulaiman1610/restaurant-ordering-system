
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

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the restaurant menu product',
    example: 'Chicken 65',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the product',
    example: 'Spicy fried chicken starter',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description:
      'Product price as a string, greater than zero, with at most 2 decimal places',
    example: '180.00',
    type: String,
    pattern: '^(?=.*[1-9])\\d{1,8}(\\.\\d{1,2})?$',
  })
  @IsString()
  @Matches(/^(?=.*[1-9])\d{1,8}(\.\d{1,2})?$/, {
    message:
      'price must be greater than zero with at most 2 decimal places',
  })
  price!: string;

  @ApiProperty({
    description: 'UUID of the category this product belongs to',
    example: 'a8d0c8a7-0552-4f77-8a18-b72144629ca0',
    format: 'uuid',
  })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({
    description: 'Whether the product is available for ordering',
    example: true,
    default: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Optional product image URL',
    example: 'https://example.com/images/chicken-65.jpg',
    format: 'uri',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
}
