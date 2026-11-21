
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the restaurant menu category',
    example: 'Hot Starters',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the menu category',
    example: 'Spicy and delicious starter dishes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
