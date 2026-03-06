import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseUp(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  getConfigStatus(): 'ok' | 'invalid' {
    const required = [
      process.env.DATABASE_URL,
      process.env.JWT_ACCESS_SECRET,
      process.env.JWT_REFRESH_SECRET,
      process.env.JWT_ACCESS_TTL,
      process.env.JWT_REFRESH_TTL,
    ];

    return required.every((value) => Boolean(value)) ? 'ok' : 'invalid';
  }
}
