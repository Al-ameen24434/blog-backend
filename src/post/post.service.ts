import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './entities/post.entity';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    const { tagIds, ...postData } = createPostDto;

    const post = await this.prisma.post.create({
      data: {
        ...postData,
        authorId: userId,
        tags: tagIds
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: true,
        tags: true,
        comments: true,
        likes: true,
      },
    });

    return new PostEntity({
      ...post,
      likesCount: post.likes.length,
    });
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      published?: boolean;
      authorId?: number;
      tagId?: number;
      search?: string;
    } = {},
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.published !== undefined) {
      where.published = query.published;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.tagId) {
      where.tags = {
        some: { id: query.tagId },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: true,
          tags: true,
          comments: true,
          likes: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    const postsWithCounts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    return {
      posts: postsWithCounts.map((post) => new PostEntity(post)),
      total,
    };
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        tags: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return new PostEntity({
      ...post,
      likesCount: post.likes.length,
    });
  }

  async findBySlug(slug: string): Promise<PostEntity> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: true,
        tags: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }

    return new PostEntity({
      ...post,
      likesCount: post.likes.length,
    });
  }

  async update(
    id: number,
    userId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    // Check if post exists and user is author
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== userId) {
      throw new NotFoundException('You are not authorized to update this post');
    }

    const { tagIds, ...postData } = updatePostDto;

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...postData,
        tags: tagIds
          ? {
              set: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: true,
        tags: true,
        comments: true,
        likes: true,
      },
    });

    return new PostEntity({
      ...updatedPost,
      likesCount: updatedPost.likes.length,
    });
  }

  async remove(id: number, userId: number): Promise<PostEntity> {
    // Check if post exists and user is author
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== userId) {
      throw new NotFoundException('You are not authorized to delete this post');
    }

    const deletedPost = await this.prisma.post.delete({
      where: { id },
      include: {
        author: true,
        tags: true,
      },
    });

    return new PostEntity(deletedPost);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: {
        // If you want to add view count, add to schema:
        // views Int @default(0)
        // and uncomment:
        // views: { increment: 1 },
      },
    });
  }

  async getPopularPosts(limit: number = 5): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: { published: true },
      include: {
        author: true,
        tags: true,
        comments: true,
        likes: true,
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return posts.map(
      (post) =>
        new PostEntity({
          ...post,
          likesCount: post.likes.length,
        }),
    );
  }
}
