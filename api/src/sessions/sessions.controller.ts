import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Roles('MANAGER', 'STAFF')
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get('current')
  @Roles('MANAGER', 'STAFF')
  async findCurrent() {
    return this.sessionsService.findCurrent();
  }

  @Post('open')
  @Roles('MANAGER')
  async open(
    @Body()
    body: {
      initialCash: number;
      startTime?: number;
    },
  ) {
    return this.sessionsService.open(body);
  }

  @Post('close')
  @Roles('MANAGER')
  async close(
    @Body()
    body: {
      sessionId?: string;
      finalCash: number;
      endTime?: number;
      expectedTotals?: {
        totalSales?: number;
        ordersCount?: number;
        totalExpenses?: number;
      };
    },
  ) {
    return this.sessionsService.close(body);
  }
}
