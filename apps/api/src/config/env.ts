type RuntimeEnv = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  allowPlainPinLogin: boolean;
  corsAllowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
};

function asPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric env value: ${value}`);
  }
  return parsed;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid boolean env value: ${value}`);
}

function readRequired(key: string): string {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

function toOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function loadRuntimeEnv(): RuntimeEnv {
  const nodeEnv =
    (process.env.NODE_ENV as RuntimeEnv['nodeEnv']) ?? 'development';
  const isProd = nodeEnv === 'production';

  process.env.PORT = process.env.PORT ?? '4000';
  process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
  process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL ?? '7d';
  process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ?? '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS ?? '100';

  if (!isProd) {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ?? 'mtm-access-dev-secret';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET ?? 'mtm-refresh-dev-secret';
    process.env.ALLOW_PLAIN_PIN_LOGIN =
      process.env.ALLOW_PLAIN_PIN_LOGIN ?? 'true';
    process.env.CORS_ALLOWED_ORIGINS =
      process.env.CORS_ALLOWED_ORIGINS ??
      'http://localhost:3000,http://127.0.0.1:3000';
  } else {
    process.env.ALLOW_PLAIN_PIN_LOGIN =
      process.env.ALLOW_PLAIN_PIN_LOGIN ?? 'false';
  }

  const env: RuntimeEnv = {
    nodeEnv,
    port: asPositiveInt(process.env.PORT, 4000),
    databaseUrl: readRequired('DATABASE_URL'),
    jwtAccessSecret: readRequired('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: readRequired('JWT_REFRESH_SECRET'),
    jwtAccessTtl: readRequired('JWT_ACCESS_TTL'),
    jwtRefreshTtl: readRequired('JWT_REFRESH_TTL'),
    allowPlainPinLogin: asBoolean(process.env.ALLOW_PLAIN_PIN_LOGIN, !isProd),
    corsAllowedOrigins: toOrigins(process.env.CORS_ALLOWED_ORIGINS),
    rateLimitWindowMs: asPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 900000),
    rateLimitMaxRequests: asPositiveInt(
      process.env.RATE_LIMIT_MAX_REQUESTS,
      100,
    ),
  };

  if (isProd) {
    if (
      env.jwtAccessSecret === 'mtm-access-dev-secret' ||
      env.jwtAccessSecret === 'change-me-in-prod-access'
    ) {
      throw new Error('JWT_ACCESS_SECRET must be changed in production');
    }
    if (
      env.jwtRefreshSecret === 'mtm-refresh-dev-secret' ||
      env.jwtRefreshSecret === 'change-me-in-prod-refresh'
    ) {
      throw new Error('JWT_REFRESH_SECRET must be changed in production');
    }
    if (env.allowPlainPinLogin) {
      throw new Error('ALLOW_PLAIN_PIN_LOGIN must be false in production');
    }
    if (env.corsAllowedOrigins.length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS is required in production');
    }
    if (env.corsAllowedOrigins.includes('change-me-in-prod-origin')) {
      throw new Error('CORS_ALLOWED_ORIGINS must be changed in production');
    }
  }

  return env;
}
