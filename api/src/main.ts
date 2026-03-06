import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { randomUUID } from 'node:crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.use((req: any, res: any, next: () => void) => {
    const startedAt = Date.now();
    const requestId = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      const log = {
        level: 'info',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      };
      // Structured logs for CI/runtime parsing.
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(log));
    });
    next();
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
