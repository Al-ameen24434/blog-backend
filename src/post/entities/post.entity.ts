import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';
import { CommentEntity } from '../../comment/entities/comment.entity';
import { TagEntity } from '../../tag/entities/tag.entity';

export class PostEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false, nullable: true })
  slug: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ required: false, nullable: true })
  thumbnail: string | null;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  authorId: number;

  @ApiProperty({ type: UserEntity })
  author?: UserEntity;

  @ApiProperty({ type: [CommentEntity] })
  comments?: CommentEntity[];

  @ApiProperty({ type: [TagEntity] })
  tags?: TagEntity[];

  @ApiProperty()
  likesCount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<PostEntity>) {
    Object.assign(this, partial);
  }
}
