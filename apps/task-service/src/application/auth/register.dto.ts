
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'owner@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Password must contain 12 to 72 characters',
    minLength: 12,
    maxLength: 72,
    format: 'password',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;
}
