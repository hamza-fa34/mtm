import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

function resolveRequestId(req: Request): string {
  const rawHeader = req.headers['x-request-id'];
  if (Array.isArray(rawHeader)) {
    return rawHeader[0] || randomUUID();
  }
  if (typeof rawHeader === 'string' && rawHeader.trim().length > 0) {
    return rawHeader;
  }
  return randomUUID();
}

function writeStructuredLog(payload: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();
  const requestId = resolveRequestId(req);

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    writeStructuredLog({
      level: 'info',
      event: 'http_request',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
