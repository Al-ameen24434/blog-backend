// src/likes/likes.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Query,
  Request,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/guards/decorators/public.decorators';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 409, description: 'Already liked this post' })
  create(@Request() req, @Body() createLikeDto: CreateLikeDto) {
    return this.likesService.create(req.user.id, createLikeDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all likes with pagination' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: number,
    @Query('postId') postId?: number,
  ) {
    return this.likesService.findAll({
      page,
      limit,
      userId,
      postId,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get like by ID' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.likesService.findOne(id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a post' })
  remove(@Request() req, @Body('postId', ParseIntPipe) postId: number) {
    return this.likesService.remove(req.user.id, postId);
  }

  @Get('post/:postId')
  @Public()
  @ApiOperation({ summary: 'Get likes by post ID' })
  getLikesByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.likesService.getLikesByPostId(postId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get likes by user ID' })
  getLikesByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.likesService.getLikesByUserId(userId);
  }
}
