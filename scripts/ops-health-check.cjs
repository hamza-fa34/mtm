#!/usr/bin/env node
/* eslint-disable no-console */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(raw) {
  if (!raw) return null;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

async function fetchStatus(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: null, error: String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkEndpoint({ baseUrl, path, retries, retryDelayMs, timeoutMs }) {
  let lastResult = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const result = await fetchStatus(`${baseUrl}${path}`, timeoutMs);
    lastResult = result;
    if (result.ok) {
      return { success: true, attempts: attempt, ...result };
    }
    if (attempt < retries) {
      await sleep(retryDelayMs);
    }
  }
  return { success: false, attempts: retries, ...lastResult };
}

async function main() {
  const baseUrl = normalizeBaseUrl(
    process.env.OPS_BASE_URL || process.argv[2] || '',
  );
  const retries = Number(process.env.OPS_RETRIES || DEFAULT_RETRIES);
  const retryDelayMs = Number(
    process.env.OPS_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS,
  );
  const timeoutMs = Number(process.env.OPS_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  if (!baseUrl) {
    console.log(
      '[ops-health-check] skipped: OPS_BASE_URL is missing (set env or pass as arg)',
    );
    process.exit(0);
  }

  console.log(
    JSON.stringify({
      event: 'ops_health_check_started',
      baseUrl,
      retries,
      retryDelayMs,
      timeoutMs,
      timestamp: new Date().toISOString(),
    }),
  );

  const health = await checkEndpoint({
    baseUrl,
    path: '/health',
    retries,
    retryDelayMs,
    timeoutMs,
  });
  const readiness = await checkEndpoint({
    baseUrl,
    path: '/health/readiness',
    retries,
    retryDelayMs,
    timeoutMs,
  });

  const result = {
    event: 'ops_health_check_result',
    timestamp: new Date().toISOString(),
    checks: {
      health,
      readiness,
    },
  };

  console.log(JSON.stringify(result));

  const ok = health.success && readiness.success;
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'ops_health_check_failed',
      timestamp: new Date().toISOString(),
      message: String(error),
    }),
  );
  process.exit(1);
});
