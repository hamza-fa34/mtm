import { getApiBaseUrl } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const TOKENS_STORAGE_KEY = 'molls_api_tokens';

let accessTokenCache: string | null = null;

function getAuthBaseUrl(): string {
  const base = getApiBaseUrl();
  if (base.endsWith('/api')) return base;
  return `${base.replace(/\/$/, '')}/api`;
}

function readStoredTokens(): AuthTokens | null {
  const raw = readJsonFromStorage<AuthTokens>(TOKENS_STORAGE_KEY);
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.accessToken || !raw.refreshToken) return null;
  return raw;
}

function storeTokens(tokens: AuthTokens): void {
  accessTokenCache = tokens.accessToken;
  writeJsonToStorage(TOKENS_STORAGE_KEY, tokens);
}

async function loginWithPin(pin: string): Promise<AuthTokens> {
  const response = await fetch(`${getAuthBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!response.ok) {
    throw new Error(`Auth login failed (${response.status})`);
  }
  const payload = (await response.json()) as Partial<AuthTokens>;
  if (!payload.accessToken || !payload.refreshToken) {
    throw new Error('Auth login returned invalid tokens');
  }
  const tokens: AuthTokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  storeTokens(tokens);
  return tokens;
}

async function refreshToken(): Promise<AuthTokens> {
  const tokens = readStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${getAuthBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });
  if (!response.ok) {
    throw new Error(`Token refresh failed (${response.status})`);
  }
  const payload = (await response.json()) as Partial<AuthTokens>;
  if (!payload.accessToken || !payload.refreshToken) {
    throw new Error('Token refresh returned invalid tokens');
  }
  const refreshed: AuthTokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  storeTokens(refreshed);
  return refreshed;
}

export async function getAccessToken(pin?: string): Promise<string> {
  if (accessTokenCache) return accessTokenCache;

  const stored = readStoredTokens();
  if (stored?.accessToken) {
    accessTokenCache = stored.accessToken;
    return stored.accessToken;
  }

  if (pin) {
    const tokens = await loginWithPin(pin);
    return tokens.accessToken;
  }

  throw new Error('No access token and no pin provided for auth');
}

export async function authenticatedApiFetch(
  path: string,
  init: RequestInit,
  pin?: string,
): Promise<Response> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  let token = await getAccessToken(pin);

  const withAuth = (access: string): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
  });

  let response = await fetch(`${baseUrl}${path}`, withAuth(token));
  if (response.status !== 401) return response;

  try {
    const refreshed = await refreshToken();
    token = refreshed.accessToken;
    response = await fetch(`${baseUrl}${path}`, withAuth(token));
    if (response.status !== 401) return response;
  } catch {
    // fall through to explicit re-login when pin is available
  }

  if (pin) {
    const relogin = await loginWithPin(pin);
    response = await fetch(`${baseUrl}${path}`, withAuth(relogin.accessToken));
  }

  return response;
}
