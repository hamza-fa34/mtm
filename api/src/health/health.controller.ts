import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const databaseUp = await this.healthService.isDatabaseUp();
    const payload = {
      status: databaseUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseUp ? 'up' : 'down',
      },
    };

    if (!databaseUp) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
