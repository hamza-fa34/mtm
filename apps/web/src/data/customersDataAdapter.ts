import { MOCK_CUSTOMERS } from '../constants';
import { Customer } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const CUSTOMERS_STORAGE_KEY = 'molls_customers';

function safePoints(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function safeTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value > 0 ? Math.floor(value) : undefined;
}

function sanitizeCustomer(input: Partial<Customer>, index: number): Customer {
  return {
    id: input.id ?? `customer-${index + 1}`,
    name:
      typeof input.name === 'string' && input.name.trim().length > 0
        ? input.name.trim()
        : `Client ${index + 1}`,
    phone: typeof input.phone === 'string' ? input.phone : '',
    email:
      typeof input.email === 'string' && input.email.trim().length > 0
        ? input.email.trim()
        : undefined,
    loyaltyPoints: safePoints(input.loyaltyPoints),
    lastVisit: safeTimestamp(input.lastVisit),
  };
}

export function getLocalCustomers(): Customer[] {
  const local = readJsonFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY);
  const source = local && Array.isArray(local) ? local : MOCK_CUSTOMERS;
  return source.map((item, index) => sanitizeCustomer(item, index));
}

async function fetchCustomersFromApi(): Promise<Customer[]> {
  const response = await fetch(`${getApiBaseUrl()}/customers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch customers from API (${response.status})`);
  }
  const data = (await response.json()) as Array<Partial<Customer>>;
  const list = Array.isArray(data) ? data : [];
  return list.map((item, index) => sanitizeCustomer(item, index));
}

export async function loadCustomers(): Promise<Customer[]> {
  const local = getLocalCustomers();
  if (getDataSourceMode() === 'api') {
    try {
      const apiCustomers = await fetchCustomersFromApi();
      if (apiCustomers.length > 0 || local.length === 0) {
        writeJsonToStorage(CUSTOMERS_STORAGE_KEY, apiCustomers);
        setDomainDataSourceStatus('customers', 'api');
        return apiCustomers;
      }
      setDomainDataSourceStatus('customers', 'fallback');
      return local;
    } catch {
      setDomainDataSourceStatus('customers', 'fallback');
      return local;
    }
  }
  setDomainDataSourceStatus('customers', 'local');
  return local;
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
  writeJsonToStorage(CUSTOMERS_STORAGE_KEY, customers);
}
