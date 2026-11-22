
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class UpdateRestaurantDto {
  @ApiPropertyOptional({
    example: 'Spice Garden Restaurant',
    description: 'Updated restaurant name',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  restaurantName?: string;

  @ApiPropertyOptional({
    example: 'Anna Nagar, Madurai',
    description: 'Updated restaurant location',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location?: string;
}
