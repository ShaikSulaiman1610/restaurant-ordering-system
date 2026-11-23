
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'auth-test-01@example.com',
    description: 'Registered user email address',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'TestPassword123!',
    description: 'Account password',
    format: 'password',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
