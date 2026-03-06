import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorLoggingInterceptor } from './common/http/error-logging.interceptor';
import { requestContextMiddleware } from './common/http/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());

  app.use(requestContextMiddleware);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
