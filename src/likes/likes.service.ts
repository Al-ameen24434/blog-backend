// src/likes/likes.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeEntity } from './entities/like.entity';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    createLikeDto: CreateLikeDto,
  ): Promise<LikeEntity> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: createLikeDto.postId },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${createLikeDto.postId} not found`,
      );
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: createLikeDto.postId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    const like = await this.prisma.like.create({
      data: {
        userId,
        postId: createLikeDto.postId,
      },
      include: {
        user: true,
        post: true,
      },
    });

    return new LikeEntity(like);
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      userId?: number;
      postId?: number;
    } = {},
  ): Promise<{ likes: LikeEntity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.postId) {
      where.postId = query.postId;
    }

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where,
        include: {
          user: true,
          post: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.like.count({ where }),
    ]);

    return {
      likes: likes.map((like) => new LikeEntity(like)),
      total,
    };
  }

  async findOne(id: number): Promise<LikeEntity> {
    const like = await this.prisma.like.findUnique({
      where: { id },
      include: {
        user: true,
        post: true,
      },
    });

    if (!like) {
      throw new NotFoundException(`Like with ID ${id} not found`);
    }

    return new LikeEntity(like);
  }

  async remove(userId: number, postId: number): Promise<LikeEntity> {
    // Check if like exists
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    const deletedLike = await this.prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      include: {
        user: true,
        post: true,
      },
    });

    return new LikeEntity(deletedLike);
  }

  async getLikesByPostId(postId: number) {
    return this.prisma.like.findMany({
      where: { postId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLikesByUserId(userId: number) {
    return this.prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
