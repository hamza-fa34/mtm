import { Body, Controller, Get, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get('current')
  async findCurrent() {
    return this.sessionsService.findCurrent();
  }

  @Post('open')
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

