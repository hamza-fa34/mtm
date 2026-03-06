#!/usr/bin/env node

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

function fail(message) {
  console.error(`[config-sanity] ${message}`);
  process.exit(1);
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    fail(`Missing required env: ${key}`);
  }
  return value;
}

const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_TTL',
  'JWT_REFRESH_TTL',
];

for (const key of required) {
  requireEnv(key);
}

const rateLimitWindowMs = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || '900000',
  10,
);
if (!Number.isFinite(rateLimitWindowMs) || rateLimitWindowMs <= 0) {
  fail('RATE_LIMIT_WINDOW_MS must be a positive integer');
}

const rateLimitMaxRequests = Number.parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || '100',
  10,
);
if (!Number.isFinite(rateLimitMaxRequests) || rateLimitMaxRequests <= 0) {
  fail('RATE_LIMIT_MAX_REQUESTS must be a positive integer');
}

if (isProd) {
  if (
    process.env.JWT_ACCESS_SECRET === 'mtm-access-dev-secret' ||
    process.env.JWT_ACCESS_SECRET === 'change-me-in-prod-access'
  ) {
    fail('JWT_ACCESS_SECRET must not use development default in production');
  }
  if (
    process.env.JWT_REFRESH_SECRET === 'mtm-refresh-dev-secret' ||
    process.env.JWT_REFRESH_SECRET === 'change-me-in-prod-refresh'
  ) {
    fail('JWT_REFRESH_SECRET must not use development default in production');
  }
  if ((process.env.ALLOW_PLAIN_PIN_LOGIN || 'false') !== 'false') {
    fail('ALLOW_PLAIN_PIN_LOGIN must be false in production');
  }
  if (!process.env.CORS_ALLOWED_ORIGINS) {
    fail('CORS_ALLOWED_ORIGINS is required in production');
  }
  if (process.env.CORS_ALLOWED_ORIGINS.includes('change-me-in-prod-origin')) {
    fail('CORS_ALLOWED_ORIGINS must not use placeholder in production');
  }
}

console.log(
  `[config-sanity] OK (NODE_ENV=${nodeEnv}, rateLimit=${rateLimitMaxRequests}/${rateLimitWindowMs}ms)`,
);
