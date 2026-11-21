
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateModifierDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,8}(\.\d{1,2})?$/, {
    message:
      'additionalPrice must be zero or positive with at most 2 decimal places',
  })
  additionalPrice?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
