import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserEntity } from '../user/entities/user.entity';
import { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /* ===================== HELPERS ===================== */

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private sanitizeUser(user: UserEntity) {
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  /* ===================== AUTH ===================== */

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;

    const passwordValid = await bcrypt.compare(password, user.password);
    return passwordValid ? user : null;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      name: registerDto.name || '',
      email: registerDto.email,
      password: hashedPassword,
      role: 'USER',
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: number) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(decoded.sub);

      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new ForbiddenException('Access Denied');
      }

      const tokens = await this.getTokens(user.id, user.email, user.role);

      const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

      await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch {
      throw new ForbiddenException('Access Denied');
    }
  }

  /* ===================== TOKENS ===================== */

  async getTokens(userId: number, email: string, role: string) {
    const accessOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    };

    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    };

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, role },
      accessOptions,
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      refreshOptions,
    );

    return { accessToken, refreshToken };
  }

  /* ===================== USER ===================== */

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);
    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);

    const passwordValid = await bcrypt.compare(oldPassword, user.password);

    if (!passwordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(userId, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }
}
