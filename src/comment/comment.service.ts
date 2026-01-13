// src/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentEntity> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${createCommentDto.postId} not found`,
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        authorId: userId,
      },
      include: {
        author: true,
        post: true,
      },
    });

    return new CommentEntity(comment);
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      postId?: number;
      authorId?: number;
    } = {},
  ): Promise<{ comments: CommentEntity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.postId) {
      where.postId = query.postId;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          author: true,
          post: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((comment) => new CommentEntity(comment)),
      total,
    };
  }

  async findOne(id: number): Promise<CommentEntity> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return new CommentEntity(comment);
  }

  async update(
    id: number,
    userId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentEntity> {
    // Check if comment exists and user is author
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.authorId !== userId) {
      throw new NotFoundException(
        'You are not authorized to update this comment',
      );
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        author: true,
        post: true,
      },
    });

    return new CommentEntity(updatedComment);
  }

  async remove(id: number, userId: number): Promise<CommentEntity> {
    // Check if comment exists and user is author
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.authorId !== userId) {
      throw new NotFoundException(
        'You are not authorized to delete this comment',
      );
    }

    const deletedComment = await this.prisma.comment.delete({
      where: { id },
      include: {
        author: true,
        post: true,
      },
    });

    return new CommentEntity(deletedComment);
  }

  async getCommentsByPostId(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
