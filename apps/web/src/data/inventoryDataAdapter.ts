import { INGREDIENTS } from '../constants';
import { Ingredient, Purchase, Waste } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';
import { authenticatedApiFetch } from './apiAuth';
import {
  createOfflineOperation,
  enqueueOfflineOperation,
  LocalStorageOfflineQueueStore,
  OfflineOperation,
  replayOfflineQueue,
} from './offlineQueue';

const INGREDIENTS_KEY = 'molls_ingredients';
const PURCHASES_KEY = 'molls_purchases';
const WASTES_KEY = 'molls_wastes';
const offlineQueueStore = new LocalStorageOfflineQueueStore();

export interface InventoryState {
  ingredients: Ingredient[];
  purchases: Purchase[];
  wastes: Waste[];
}

export interface PurchaseWritePayload {
  ingredientId: string;
  supplierName?: string;
  quantity: number;
  totalPrice: number;
  date?: number;
}

export interface WasteWritePayload {
  ingredientId: string;
  quantity: number;
  reason: string;
  date?: number;
}

function normalizeIngredientUnit(unit: string): Ingredient['unit'] {
  const normalized = unit.toLowerCase();
  if (normalized === 'kg' || normalized === 'g' || normalized === 'ml') {
    return normalized;
  }
  if (normalized === 'l') {
    return 'L';
  }
  return 'unit';
}

function normalizeWasteReason(reason: string): Waste['reason'] {
  if (reason === 'Casse' || reason === 'Erreur' || reason === 'Autre') return reason;
  if (reason === 'Péremption' || reason === 'Peremption') return 'Péremption';
  return 'Autre';
}

function sanitizePurchase(input: Partial<Purchase>, index: number): Purchase {
  const date =
    typeof input.date === 'number' && Number.isFinite(input.date)
      ? input.date
      : Date.now();
  return {
    id: input.id ?? `purchase-${index + 1}`,
    ingredientId: input.ingredientId ?? '',
    supplierName:
      typeof input.supplierName === 'string' ? input.supplierName : '',
    date,
    quantity:
      typeof input.quantity === 'number' && Number.isFinite(input.quantity)
        ? input.quantity
        : 0,
    totalPrice:
      typeof input.totalPrice === 'number' && Number.isFinite(input.totalPrice)
        ? input.totalPrice
        : 0,
  };
}

function sanitizeWaste(input: Partial<Waste>, index: number): Waste {
  const date =
    typeof input.date === 'number' && Number.isFinite(input.date)
      ? input.date
      : Date.now();
  return {
    id: input.id ?? `waste-${index + 1}`,
    ingredientId: input.ingredientId ?? '',
    quantity:
      typeof input.quantity === 'number' && Number.isFinite(input.quantity)
        ? input.quantity
        : 0,
    reason: normalizeWasteReason(input.reason ?? 'Autre'),
    date,
  };
}

export function getLocalInventoryState(): InventoryState {
  const localIngredients = readJsonFromStorage<Ingredient[]>(INGREDIENTS_KEY);
  const localPurchases = readJsonFromStorage<Purchase[]>(PURCHASES_KEY);
  const localWastes = readJsonFromStorage<Waste[]>(WASTES_KEY);

  return {
    ingredients:
      localIngredients && Array.isArray(localIngredients)
        ? localIngredients
        : INGREDIENTS,
    purchases:
      localPurchases && Array.isArray(localPurchases)
        ? localPurchases.map((item, index) => sanitizePurchase(item, index))
        : [],
    wastes:
      localWastes && Array.isArray(localWastes)
        ? localWastes.map((item, index) => sanitizeWaste(item, index))
        : [],
  };
}

async function fetchInventoryFromApi(): Promise<InventoryState> {
  const [ingredientsRes, purchasesRes, wastesRes] = await Promise.all([
    fetch(`${getApiBaseUrl()}/inventory/ingredients`),
    fetch(`${getApiBaseUrl()}/inventory/purchases`),
    fetch(`${getApiBaseUrl()}/inventory/wastes`),
  ]);

  if (!ingredientsRes.ok) {
    throw new Error(`Failed to fetch ingredients from API (${ingredientsRes.status})`);
  }
  if (!purchasesRes.ok) {
    throw new Error(`Failed to fetch purchases from API (${purchasesRes.status})`);
  }
  if (!wastesRes.ok) {
    throw new Error(`Failed to fetch wastes from API (${wastesRes.status})`);
  }

  const ingredientsRaw = (await ingredientsRes.json()) as Array<{
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    costPrice: number;
    category: string;
  }>;
  const purchasesRaw = (await purchasesRes.json()) as Array<{
    id: string;
    ingredientId: string;
    supplierName: string;
    date: number;
    quantity: number;
    totalPrice: number;
  }>;
  const wastesRaw = (await wastesRes.json()) as Array<{
    id: string;
    ingredientId: string;
    quantity: number;
    reason: string;
    date: number;
  }>;

  return {
    ingredients: (Array.isArray(ingredientsRaw) ? ingredientsRaw : []).map((i) => ({
      id: i.id,
      name: i.name,
      unit: normalizeIngredientUnit(i.unit),
      currentStock: i.currentStock,
      minStock: i.minStock,
      costPrice: i.costPrice,
      category: i.category,
    })),
    purchases: (Array.isArray(purchasesRaw) ? purchasesRaw : []).map((p, index) =>
      sanitizePurchase(p, index),
    ),
    wastes: (Array.isArray(wastesRaw) ? wastesRaw : []).map((w, index) =>
      sanitizeWaste(
        {
          id: w.id,
          ingredientId: w.ingredientId,
          quantity: w.quantity,
          reason: normalizeWasteReason(w.reason),
          date: w.date,
        },
        index,
      ),
    ),
  };
}

export async function loadInventoryState(): Promise<InventoryState> {
  const local = getLocalInventoryState();
  if (getDataSourceMode() === 'api') {
    try {
      const apiState = await fetchInventoryFromApi();
      const hasApiData =
        apiState.ingredients.length > 0 ||
        apiState.purchases.length > 0 ||
        apiState.wastes.length > 0;
      const hasLocalData =
        local.ingredients.length > 0 ||
        local.purchases.length > 0 ||
        local.wastes.length > 0;

      if (hasApiData || !hasLocalData) {
        writeJsonToStorage(INGREDIENTS_KEY, apiState.ingredients);
        writeJsonToStorage(PURCHASES_KEY, apiState.purchases);
        writeJsonToStorage(WASTES_KEY, apiState.wastes);
        setDomainDataSourceStatus('inventory', 'api');
        return apiState;
      }

      setDomainDataSourceStatus('inventory', 'fallback');
      return local;
    } catch {
      setDomainDataSourceStatus('inventory', 'fallback');
      return local;
    }
  }

  setDomainDataSourceStatus('inventory', 'local');
  return local;
}

export async function saveInventoryState(state: InventoryState): Promise<void> {
  writeJsonToStorage(INGREDIENTS_KEY, state.ingredients);
  writeJsonToStorage(PURCHASES_KEY, state.purchases);
  writeJsonToStorage(WASTES_KEY, state.wastes);
}

async function executeInventoryOfflineOperation(
  operation: OfflineOperation<PurchaseWritePayload | WasteWritePayload>,
  pin?: string,
): Promise<void> {
  if (operation.action === 'create_purchase') {
    const response = await authenticatedApiFetch(
      '/inventory/purchases',
      {
        method: 'POST',
        body: JSON.stringify(operation.payload),
      },
      pin,
    );
    if (!response.ok) {
      throw new Error(`Failed to create purchase via API (${response.status})`);
    }
    return;
  }

  if (operation.action === 'create_waste') {
    const response = await authenticatedApiFetch(
      '/inventory/wastes',
      {
        method: 'POST',
        body: JSON.stringify(operation.payload),
      },
      pin,
    );
    if (!response.ok) {
      throw new Error(`Failed to create waste via API (${response.status})`);
    }
    return;
  }

  throw new Error(`Unsupported inventory action: ${operation.action}`);
}

export async function writePurchaseApiFirstOrQueue(
  payload: PurchaseWritePayload,
  pin?: string,
): Promise<{ queued: boolean; synced: boolean; operationId: string }> {
  if (getDataSourceMode() !== 'api') {
    setDomainDataSourceStatus('inventory', 'local');
    return { queued: false, synced: false, operationId: 'local-mode' };
  }

  const operation = createOfflineOperation({
    domain: 'inventory',
    action: 'create_purchase',
    payload,
  });

  try {
    await executeInventoryOfflineOperation(operation, pin);
    setDomainDataSourceStatus('inventory', 'api');
    return { queued: false, synced: true, operationId: operation.operationId };
  } catch {
    await enqueueOfflineOperation(offlineQueueStore, operation);
    setDomainDataSourceStatus('inventory', 'fallback');
    return { queued: true, synced: false, operationId: operation.operationId };
  }
}

export async function writeWasteApiFirstOrQueue(
  payload: WasteWritePayload,
  pin?: string,
): Promise<{ queued: boolean; synced: boolean; operationId: string }> {
  if (getDataSourceMode() !== 'api') {
    setDomainDataSourceStatus('inventory', 'local');
    return { queued: false, synced: false, operationId: 'local-mode' };
  }

  const operation = createOfflineOperation({
    domain: 'inventory',
    action: 'create_waste',
    payload,
  });

  try {
    await executeInventoryOfflineOperation(operation, pin);
    setDomainDataSourceStatus('inventory', 'api');
    return { queued: false, synced: true, operationId: operation.operationId };
  } catch {
    await enqueueOfflineOperation(offlineQueueStore, operation);
    setDomainDataSourceStatus('inventory', 'fallback');
    return { queued: true, synced: false, operationId: operation.operationId };
  }
}

export async function replayPendingInventoryWrites(pin?: string): Promise<void> {
  if (getDataSourceMode() !== 'api') return;

  await replayOfflineQueue(offlineQueueStore, async (operation) => {
    if (operation.domain !== 'inventory') return;
    await executeInventoryOfflineOperation(
      operation as OfflineOperation<PurchaseWritePayload | WasteWritePayload>,
      pin,
    );
  });
}
