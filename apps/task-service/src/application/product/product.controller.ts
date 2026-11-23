
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

@ApiTags('Products')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a menu product for the specified restaurant.',
  })
  @ApiCreatedResponse({
    description: 'Product created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid product data or restaurant ID.',
  })
  @ApiConflictResponse({
    description: 'Product conflicts with an existing record.',
  })
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with pagination, filtering and sorting',
    description:
      'Returns paginated restaurant products. Supports category, availability, and sorting filters.',
  })
  @ApiOkResponse({
    description: 'Paginated products retrieved successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination, filtering, or sorting parameters.',
  })
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.productService.findAll(tenantId, query);
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Get product by ID',
  })
  @ApiParam({
    name: 'productId',
    description: 'Unique product ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Product retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found.',
  })
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productService.findOne(tenantId, productId);
  }

  @Patch(':productId')
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Updates an existing restaurant menu product.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Unique product ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Product updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid product update data.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found.',
  })
  async update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(
      tenantId,
      productId,
      dto,
    );
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Unique product ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Product deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Product not found.',
  })
  @ApiConflictResponse({
    description:
      'Product cannot be deleted because related records exist.',
  })
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.productService.remove(tenantId, productId);
  }
}
