import { PRODUCTS } from '../constants';
import { Product } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const PRODUCTS_STORAGE_KEY = 'molls_products';

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeProduct(input: Partial<Product>, index: number): Product {
  const recipe = Array.isArray(input.recipe)
    ? input.recipe
        .filter((item) => item && typeof item.ingredientId === 'string')
        .map((item) => ({
          ingredientId: item.ingredientId,
          quantity: safeNumber(item.quantity, 0),
        }))
    : [];

  const variants = Array.isArray(input.variants)
    ? input.variants
        .filter((variant) => variant && typeof variant.name === 'string')
        .map((variant, variantIndex) => ({
          id: variant.id ?? `variant-${index + 1}-${variantIndex + 1}`,
          name: variant.name,
          priceExtra: safeNumber(variant.priceExtra, 0),
        }))
    : [];

  return {
    id: input.id ?? `product-${index + 1}`,
    categoryId: input.categoryId ?? '1',
    name: typeof input.name === 'string' ? input.name : `Produit ${index + 1}`,
    price: safeNumber(input.price, 0),
    vatRate: safeNumber(input.vatRate, 10),
    recipe,
    imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl : undefined,
    isAvailable:
      typeof input.isAvailable === 'boolean' ? input.isAvailable : true,
    loyaltyPrice:
      typeof input.loyaltyPrice === 'number' &&
      Number.isFinite(input.loyaltyPrice)
        ? input.loyaltyPrice
        : undefined,
    variants,
  };
}

export function getLocalProducts(): Product[] {
  const local = readJsonFromStorage<Product[]>(PRODUCTS_STORAGE_KEY);
  const source = local && Array.isArray(local) ? local : PRODUCTS;
  return source.map((item, index) => sanitizeProduct(item, index));
}

async function fetchProductsFromApi(): Promise<Product[]> {
  const response = await fetch(`${getApiBaseUrl()}/products`);
  if (!response.ok) {
    throw new Error(`Failed to fetch products from API (${response.status})`);
  }
  const data = (await response.json()) as Array<Partial<Product>>;
  const list = Array.isArray(data) ? data : [];
  return list.map((item, index) => sanitizeProduct(item, index));
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
