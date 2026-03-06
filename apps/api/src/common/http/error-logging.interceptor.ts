import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      catchError((exception: unknown) => {
        const statusCode =
          exception instanceof HttpException ? exception.getStatus() : 500;

        const message =
          exception instanceof Error ? exception.message : 'Unexpected error';

        const stack =
          exception instanceof Error && process.env.NODE_ENV !== 'production'
            ? exception.stack
            : undefined;

        const log = {
          level: 'error',
          event: 'http_error',
          requestId: req.requestId ?? req.headers['x-request-id'] ?? null,
          method: req.method,
          path: req.originalUrl,
          statusCode,
          responseStatusCode: res.statusCode,
          message,
          ...(stack ? { stack } : {}),
        };

        // eslint-disable-next-line no-console
        console.error(JSON.stringify(log));

        return throwError(() => exception);
      }),
    );
  }
}
