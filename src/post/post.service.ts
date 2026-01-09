import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        thumbnail: dto.thumbnail,
        published: dto.published ?? false,
        authorId: userId,
        tags: dto.tagIds
          ? {
              connect: dto.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }

  findAll(page = 1) {
    return this.prisma.post.findMany({
      where: { published: true },
      take: 10,
      skip: (page - 1) * 10,
      include: {
        author: true,
        tags: true,
        _count: { select: { likes: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        comments: { include: { author: true } },
        tags: true,
      },
    });
  }

  update(id: number, userId: number, data) {
    return this.prisma.post.update({
      where: { id, authorId: userId },
      data,
    });
  }

  delete(id: number, userId: number) {
    return this.prisma.post.delete({
      where: { id, authorId: userId },
    });
  }
}
