
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ApiProperty,
} from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiProperty({
    example: 'Spice Garden',
    description: 'Name of the restaurant',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  restaurantName!: string;

  @ApiProperty({
    example: 'Madurai, Tamil Nadu',
    description: 'Restaurant location',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location!: string;
}
