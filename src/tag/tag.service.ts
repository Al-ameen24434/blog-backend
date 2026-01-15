import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagEntity } from './entities/tag.entity';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto): Promise<TagEntity> {
    // Check if tag already exists
    const existingTag = await this.prisma.tag.findUnique({
      where: { name: createTagDto.name },
    });

    if (existingTag) {
      throw new ConflictException(`Tag "${createTagDto.name}" already exists`);
    }

    const tag = await this.prisma.tag.create({
      data: createTagDto,
    });

    return new TagEntity(tag);
  }

  async findAll(): Promise<TagEntity[]> {
    const tags = await this.prisma.tag.findMany({
      include: {
        posts: {
          include: {
            author: true,
            tags: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    return tags.map((tag) => new TagEntity(tag));
  }

  async findOne(id: number): Promise<TagEntity> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            author: true,
            tags: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return new TagEntity(tag);
  }

  async findByName(name: string): Promise<TagEntity> {
    const tag = await this.prisma.tag.findUnique({
      where: { name },
      include: {
        posts: {
          include: {
            author: true,
            tags: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag "${name}" not found`);
    }

    return new TagEntity(tag);
  }

  async remove(id: number): Promise<TagEntity> {
    // Check if tag exists
    await this.findOne(id);

    const tag = await this.prisma.tag.delete({
      where: { id },
    });

    return new TagEntity(tag);
  }

  async getPopularTags(limit: number = 10): Promise<TagEntity[]> {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags.map((tag) => {
      const { _count, ...tagData } = tag;
      return new TagEntity(tagData);
    });
  }
}
