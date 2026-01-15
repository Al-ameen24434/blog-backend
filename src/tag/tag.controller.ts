// src/tags/tags.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/decorators/roles.decorators';
import { Public } from '../auth/guards/decorators/public.decorators';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagsService: TagService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all tags' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'Get popular tags' })
  getPopularTags(@Query('limit') limit?: number) {
    return this.tagsService.getPopularTags(limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.findOne(id);
  }

  @Get('name/:name')
  @Public()
  @ApiOperation({ summary: 'Get tag by name' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findByName(@Param('name') name: string) {
    return this.tagsService.findByName(name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tag (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }
}
