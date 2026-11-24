
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

import { ModifierService } from './modifier.service.js';
import { CreateModifierDto } from './dto/create-modifier.dto.js';
import { UpdateModifierDto } from './dto/update-modifier.dto.js';

@ApiTags('Modifiers')
@ApiParam({
  name: 'tenantId',
  description: 'Unique restaurant ID (UUID)',
  type: String,
  format: 'uuid',
})
@Controller('tenants/:tenantId/modifiers')
export class ModifierController {
  constructor(
    private readonly modifierService: ModifierService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new modifier',
    description:
      'Creates a modifier for the specified restaurant.',
  })
  @ApiCreatedResponse({
    description: 'Modifier created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid modifier data or restaurant ID.',
  })
  @ApiConflictResponse({
    description: 'Modifier conflicts with an existing record.',
  })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.modifierService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all modifiers',
    description:
      'Returns all modifiers belonging to the specified restaurant.',
  })
  @ApiOkResponse({
    description: 'Modifiers retrieved successfully.',
  })
  findAll(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ) {
    return this.modifierService.findAll(tenantId);
  }

  @Get(':modifierId')
  @ApiOperation({
    summary: 'Get modifier by ID',
  })
  @ApiParam({
    name: 'modifierId',
    description: 'Unique modifier ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Modifier retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Modifier not found.',
  })
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
  @ApiOperation({
    summary: 'Update a modifier',
    description:
      'Updates an existing restaurant modifier.',
  })
  @ApiParam({
    name: 'modifierId',
    description: 'Unique modifier ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Modifier updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid modifier update data.',
  })
  @ApiNotFoundResponse({
    description: 'Modifier not found.',
  })
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
  @ApiOperation({
    summary: 'Delete a modifier',
  })
  @ApiParam({
    name: 'modifierId',
    description: 'Unique modifier ID (UUID)',
    type: String,
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Modifier deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Modifier not found.',
  })
  @ApiConflictResponse({
    description:
      'Modifier cannot be deleted because related records exist.',
  })
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
