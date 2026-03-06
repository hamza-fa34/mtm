import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = {
  id: string;
  name: string;
  role: 'MANAGER' | 'STAFF';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithPin(pin: string) {
    const user = await this.findUserByPin(pin);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser: AuthUser = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    return {
      user: safeUser,
      ...(await this.issueTokens(safeUser)),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        name: string;
        role: 'MANAGER' | 'STAFF';
      }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'mtm-refresh-dev-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not active');
      }

      const safeUser: AuthUser = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      return {
        user: safeUser,
        ...(await this.issueTokens(safeUser)),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findUserByPin(pin: string) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
    });

    for (const user of users) {
      const pinHash = user.pinHash;
      const isBcrypt = pinHash.startsWith('$2a$') || pinHash.startsWith('$2b$');
      const allowPlainPinLogin =
        process.env.ALLOW_PLAIN_PIN_LOGIN === 'true' ||
        process.env.NODE_ENV !== 'production';
      const isValid = isBcrypt
        ? await compare(pin, pinHash)
        : allowPlainPinLogin && pinHash === pin;
      if (isValid) {
        return user;
      }
    }

    return null;
  }

  private async issueTokens(user: AuthUser) {
    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'mtm-access-dev-secret',
      expiresIn: (process.env.JWT_ACCESS_TTL as any) ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'mtm-refresh-dev-secret',
      expiresIn: (process.env.JWT_REFRESH_TTL as any) ?? '7d',
    });

    return { accessToken, refreshToken };
  }
}
