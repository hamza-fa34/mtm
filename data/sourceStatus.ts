import { getDataSourceMode } from './config';

export type DataSourceRuntimeStatus = 'local' | 'api' | 'fallback';
type DataDomain = 'settings' | 'products' | 'customers' | 'orders' | 'inventory';

const domainStatus: Partial<Record<DataDomain, DataSourceRuntimeStatus>> = {};
const listeners = new Set<() => void>();

export function setDomainDataSourceStatus(
  domain: DataDomain,
  status: DataSourceRuntimeStatus,
): void {
  domainStatus[domain] = status;
  listeners.forEach((listener) => listener());
}

export function getGlobalDataSourceStatus(): DataSourceRuntimeStatus {
  const values = Object.values(domainStatus);
  if (values.length === 0) {
    return getDataSourceMode() === 'api' ? 'api' : 'local';
  }
  if (values.includes('fallback')) return 'fallback';
  if (values.includes('api')) return 'api';
  return 'local';
}

export function subscribeToDataSourceStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
