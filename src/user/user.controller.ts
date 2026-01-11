import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private service: UsersService) {}

  /** Current user */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() req) {
    return this.service.getMe(req.user.id);
  }

  /** Public user profile */
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.service.getUserById(+id);
  }

  /** Update own profile */
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    return this.service.update(req.user.id, dto);
  }
}
