import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /** Get current logged-in user */

  getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  /** Public profile */
  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        posts: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /** Update own profile */
  async update(userId: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
      },
    });
  }
}
