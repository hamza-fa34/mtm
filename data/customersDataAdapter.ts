import { MOCK_CUSTOMERS } from '../constants';
import { Customer } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const CUSTOMERS_STORAGE_KEY = 'molls_customers';

export function getLocalCustomers(): Customer[] {
  const local = readJsonFromStorage<Customer[]>(CUSTOMERS_STORAGE_KEY);
  return local && Array.isArray(local) ? local : MOCK_CUSTOMERS;
}

async function fetchCustomersFromApi(): Promise<Customer[]> {
  const response = await fetch(`${getApiBaseUrl()}/customers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch customers from API (${response.status})`);
  }
  const data = (await response.json()) as Customer[];
  return Array.isArray(data) ? data : [];
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
