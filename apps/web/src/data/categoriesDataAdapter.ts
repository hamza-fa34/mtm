import { CATEGORIES } from '../constants';
import { Category } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const CATEGORIES_STORAGE_KEY = 'molls_categories';

function sanitizeCategory(input: Partial<Category>, index: number): Category {
  return {
    id: input.id ?? `cat-${index + 1}`,
    name: input.name ?? `Categorie ${index + 1}`,
    color: input.color ?? 'bg-gray-500',
    ordre: Number.isFinite(input.ordre) ? Number(input.ordre) : index + 1,
  };
}

export function getLocalCategories(): Category[] {
  const local = readJsonFromStorage<Category[]>(CATEGORIES_STORAGE_KEY);
  const source = local && Array.isArray(local) ? local : CATEGORIES;
  return source.map((item, index) => sanitizeCategory(item, index));
}

async function fetchCategoriesFromApi(): Promise<Category[]> {
  const response = await fetch(`${getApiBaseUrl()}/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories from API (${response.status})`);
  }

  const data = (await response.json()) as Array<Partial<Category>>;
  const categories = Array.isArray(data) ? data : [];
  return categories
    .map((item, index) => sanitizeCategory(item, index))
    .sort((a, b) => a.ordre - b.ordre);
}

export async function loadCategories(): Promise<Category[]> {
  const local = getLocalCategories();
  if (getDataSourceMode() === 'api') {
    try {
      const apiCategories = await fetchCategoriesFromApi();
      if (apiCategories.length > 0 || local.length === 0) {
        writeJsonToStorage(CATEGORIES_STORAGE_KEY, apiCategories);
        setDomainDataSourceStatus('categories', 'api');
        return apiCategories;
      }
      setDomainDataSourceStatus('categories', 'fallback');
      return local;
    } catch {
      setDomainDataSourceStatus('categories', 'fallback');
      return local;
    }
  }

  setDomainDataSourceStatus('categories', 'local');
  return local;
}

export async function saveCategories(categories: Category[]): Promise<void> {
  writeJsonToStorage(CATEGORIES_STORAGE_KEY, categories);
  setDomainDataSourceStatus(
    'categories',
    getDataSourceMode() === 'api' ? 'fallback' : 'local',
  );
}
