// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { TagModule } from './tag/tag.module';
import { LikesModule } from './likes/likes.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtGlobalGuard } from './auth/guards/jwt-global.guard';
//import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ClassSerializerInterceptor } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    TagModule,
    LikesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGlobalGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: TransformInterceptor,
    // },
  ],
})
export class AppModule {}
