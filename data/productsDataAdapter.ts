import { PRODUCTS } from '../constants';
import { Product } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const PRODUCTS_STORAGE_KEY = 'molls_products';

export function getLocalProducts(): Product[] {
  const local = readJsonFromStorage<Product[]>(PRODUCTS_STORAGE_KEY);
  return local && Array.isArray(local) ? local : PRODUCTS;
}

async function fetchProductsFromApi(): Promise<Product[]> {
  const response = await fetch(`${getApiBaseUrl()}/products`);
  if (!response.ok) {
    throw new Error(`Failed to fetch products from API (${response.status})`);
  }
  const data = (await response.json()) as Product[];
  return Array.isArray(data) ? data : [];
}

export async function loadProducts(): Promise<Product[]> {
  const local = getLocalProducts();
  if (getDataSourceMode() === 'api') {
    try {
      const apiProducts = await fetchProductsFromApi();
      if (apiProducts.length > 0 || local.length === 0) {
        writeJsonToStorage(PRODUCTS_STORAGE_KEY, apiProducts);
        setDomainDataSourceStatus('products', 'api');
        return apiProducts;
      }
      setDomainDataSourceStatus('products', 'fallback');
      return local;
    } catch {
      setDomainDataSourceStatus('products', 'fallback');
      return local;
    }
  }
  setDomainDataSourceStatus('products', 'local');
  return local;
}

export async function saveProducts(products: Product[]): Promise<void> {
  writeJsonToStorage(PRODUCTS_STORAGE_KEY, products);
}
