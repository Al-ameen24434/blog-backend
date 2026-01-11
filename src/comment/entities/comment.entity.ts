import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';
import { PostEntity } from '../../post/entities/post.entity';

export class CommentEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  postId: number;

  @ApiProperty()
  authorId: number;

  @ApiProperty({ type: UserEntity })
  author?: UserEntity;

  @ApiProperty({ type: PostEntity })
  post?: PostEntity;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<CommentEntity>) {
    Object.assign(this, partial);
  }
}
