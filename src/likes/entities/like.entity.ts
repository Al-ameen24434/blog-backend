// src/likes/entities/like.entity.ts
import { ApiProperty } from '@nestjs/swagger';

export class LikeEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  postId: number;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<LikeEntity>) {
    Object.assign(this, partial);
  }
}
