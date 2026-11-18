
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
} from '@nestjs/common';

import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('tenants/:tenantId/products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) {}

  @Post()
  async create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return this.productService.findAll(tenantId);
  }

  @Get(':productId')
  async findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productService.findOne(tenantId, productId);
  }

  @Patch(':productId')
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
  async remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.productService.remove(tenantId, productId);
  }
}
