import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ErrorLoggingInterceptor } from './common/http/error-logging.interceptor';
import { requestContextMiddleware } from './common/http/request-context.middleware';
import { loadRuntimeEnv } from './config/env';

async function bootstrap() {
  const env = loadRuntimeEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.use(helmet());
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());
  app.use(requestContextMiddleware);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || env.corsAllowedOrigins.length === 0) {
        callback(null, true);
        return;
      }
      if (env.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  });

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      limit: env.rateLimitMaxRequests,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  await app.listen(env.port);
}
bootstrap();
