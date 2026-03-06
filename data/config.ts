export type DataSourceMode = 'local' | 'api';

export function getDataSourceMode(): DataSourceMode {
  const raw = (import.meta.env.VITE_DATA_SOURCE ?? 'local').toString().toLowerCase();
  return raw === 'api' ? 'api' : 'local';
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api').toString();
}
