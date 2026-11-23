
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  PRICE = 'price',
}

export enum ProductSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number, starting from 1',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of products per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Filter products by category UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product availability',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Field used for sorting',
    enum: ProductSortBy,
    default: ProductSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy: ProductSortBy = ProductSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sorting direction',
    enum: ProductSortOrder,
    default: ProductSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(ProductSortOrder)
  sortOrder: ProductSortOrder = ProductSortOrder.DESC;
}
