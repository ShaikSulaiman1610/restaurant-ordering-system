
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

import { ModifierService } from './modifier.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';

@Controller('tenants/:tenantId/modifiers')
export class ModifierController {
  constructor(
    private readonly modifierService: ModifierService,
  ) {}

  @Post()
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.modifierService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return this.modifierService.findAll(tenantId);
  }

  @Get(':modifierId')
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
  ) {
    return this.modifierService.findOne(
      tenantId,
      modifierId,
    );
  }

  @Patch(':modifierId')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
    @Body() dto: UpdateModifierDto,
  ) {
    return this.modifierService.update(
      tenantId,
      modifierId,
      dto,
    );
  }

  @Delete(':modifierId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('modifierId', ParseUUIDPipe) modifierId: string,
  ) {
    return this.modifierService.remove(
      tenantId,
      modifierId,
    );
  }
}
