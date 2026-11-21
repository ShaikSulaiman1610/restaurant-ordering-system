
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateModifierDto {
  @ApiProperty({
    description: 'Name of the product modifier',
    example: 'Extra Cheese',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional modifier description',
    example: 'Add extra cheese to the selected product',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description:
      'Additional price as a string, zero or positive, with at most 2 decimal places',
    example: '30.00',
    type: String,
    pattern: '^\\d{1,8}(\\.\\d{1,2})?$',
  })
  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message:
      'additionalPrice must be zero or positive with at most 2 decimal places',
  })
  additionalPrice!: string;

  @ApiProperty({
    description: 'UUID of the product this modifier belongs to',
    example: '901d345d-5c24-4022-945c-77c9032c4bb1',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({
    description: 'Whether the modifier is available',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
