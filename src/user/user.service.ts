import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return new UserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      include: {
        posts: true,
        comments: true,
        likes: true,
      },
    });
    return users.map((user) => new UserEntity(user));
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            tags: true,
            comments: true,
            likes: true,
          },
        },
        comments: true,
        likes: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? new UserEntity(user) : null;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Check if user exists
    await this.findOne(id);

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(user);
  }

  async remove(id: number): Promise<UserEntity> {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
    });

    return new UserEntity(user);
  }

  async getPostsByUserId(userId: number) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: true,
        tags: true,
        comments: true,
        likes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));
  }

  async getCommentsByUserId(userId: number) {
    return this.prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        post: true,
        author: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
