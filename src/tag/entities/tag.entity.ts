import { ApiProperty } from '@nestjs/swagger';

export class TagEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  constructor(partial: Partial<TagEntity>) {
    Object.assign(this, partial);
  }
}
