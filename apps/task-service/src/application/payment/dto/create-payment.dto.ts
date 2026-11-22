
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SimulatedPaymentResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'UUID of the order being paid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    description: 'Unique reference for this payment attempt',
    example: 'TXN-ORDER-001',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  transactionReference!: string;

  @ApiProperty({
    description: 'Simulated payment result',
    enum: SimulatedPaymentResult,
    example: SimulatedPaymentResult.SUCCESS,
  })
  @IsEnum(SimulatedPaymentResult)
  result!: SimulatedPaymentResult;
}
