import { MOCK_ORDERS } from '../constants';
import { DailySession, Order } from '../types';
import { getDataSourceMode } from './config';
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

const ORDERS_KEY = 'molls_orders';
const CURRENT_SESSION_KEY = 'molls_current_session';
const SESSIONS_HISTORY_KEY = 'molls_sessions_history';
const offlineQueueStore = new LocalStorageOfflineQueueStore();

export interface OrdersState {
  orders: Order[];
  currentSession: DailySession | null;
  sessionsHistory: DailySession[];
}

export interface CreateOrderWritePayload {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantName?: string;
    isRedeemed?: boolean;
    redeemedPoints?: number;
  }>;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'TR';
  serviceMode: 'TAKEAWAY' | 'DINE_IN';
  customerId?: string;
}

export interface OpenSessionWritePayload {
  initialCash: number;
  startTime?: number;
}

export interface CloseSessionWritePayload {
  sessionId?: string;
  finalCash: number;
  endTime?: number;
  expectedTotals?: {
    totalSales?: number;
    ordersCount?: number;
    totalExpenses?: number;
  };
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeOrder(input: Partial<Order>, index: number): Order {
  const items = Array.isArray(input.items)
    ? input.items.map((item, itemIndex) => ({
        id: item.id ?? `order-item-${index + 1}-${itemIndex + 1}`,
        productId: item.productId ?? '',
        product: {
          id: item.product?.id ?? `product-${itemIndex + 1}`,
          categoryId: item.product?.categoryId ?? '1',
          name: item.product?.name ?? 'Produit',
          price: safeNumber(item.product?.price, 0),
          vatRate: safeNumber(item.product?.vatRate, 10),
          recipe: Array.isArray(item.product?.recipe)
            ? item.product.recipe.map((recipeItem) => ({
                ingredientId: recipeItem.ingredientId,
                quantity: safeNumber(recipeItem.quantity, 0),
              }))
            : [],
          imageUrl:
            typeof item.product?.imageUrl === 'string'
              ? item.product.imageUrl
              : undefined,
          isAvailable:
            typeof item.product?.isAvailable === 'boolean'
              ? item.product.isAvailable
              : true,
          loyaltyPrice:
            typeof item.product?.loyaltyPrice === 'number'
              ? item.product.loyaltyPrice
              : undefined,
          variants: Array.isArray(item.product?.variants)
            ? item.product.variants.map((variant, variantIndex) => ({
                id: variant.id ?? `variant-${variantIndex + 1}`,
                name: variant.name ?? 'Option',
                priceExtra: safeNumber(variant.priceExtra, 0),
              }))
            : [],
        },
        quantity: safeNumber(item.quantity, 1),
        unitPrice: safeNumber(item.unitPrice, 0),
        totalPrice: safeNumber(item.totalPrice, 0),
        isRedeemed: typeof item.isRedeemed === 'boolean' ? item.isRedeemed : undefined,
        selectedVariant: item.selectedVariant
          ? {
              id: item.selectedVariant.id ?? 'variant',
              name: item.selectedVariant.name ?? 'Option',
              priceExtra: safeNumber(item.selectedVariant.priceExtra, 0),
            }
          : undefined,
      }))
    : [];

  return {
    id: input.id ?? `order-${index + 1}`,
    orderNumber:
      typeof input.orderNumber === 'string'
        ? input.orderNumber
        : `${index + 100}`,
    timestamp: safeNumber(input.timestamp, Date.now()),
    items,
    total: safeNumber(input.total, 0),
    status:
      input.status &&
      ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].includes(
        input.status,
      )
        ? input.status
        : 'PENDING',
    paymentMethod:
      input.paymentMethod &&
      ['CASH', 'CARD', 'TR'].includes(input.paymentMethod)
        ? input.paymentMethod
        : undefined,
    serviceMode:
      input.serviceMode && ['TAKEAWAY', 'DINE_IN'].includes(input.serviceMode)
        ? input.serviceMode
        : 'TAKEAWAY',
    customerId:
      typeof input.customerId === 'string' ? input.customerId : undefined,
  };
}

function sanitizeDailySession(input: Partial<DailySession>, index: number): DailySession {
  const status =
    input.status && ['OPEN', 'CLOSED'].includes(input.status)
      ? input.status
      : 'OPEN';

  return {
    id: input.id ?? `session-${index + 1}`,
    startTime: safeNumber(input.startTime, Date.now()),
    endTime:
      typeof input.endTime === 'number' && Number.isFinite(input.endTime)
        ? input.endTime
        : undefined,
    initialCash: safeNumber(input.initialCash, 0),
    finalCash:
      typeof input.finalCash === 'number' && Number.isFinite(input.finalCash)
        ? input.finalCash
        : undefined,
    totalSales: safeNumber(input.totalSales, 0),
    totalExpenses: safeNumber(input.totalExpenses, 0),
    ordersCount: safeNumber(input.ordersCount, 0),
    status,
    salesByMethod:
      input.salesByMethod && typeof input.salesByMethod === 'object'
        ? input.salesByMethod
        : { CASH: 0, CARD: 0, TR: 0 },
    vatSummary:
      input.vatSummary && typeof input.vatSummary === 'object'
        ? input.vatSummary
        : {},
  };
}

export function getLocalOrdersState(): OrdersState {
  const localOrders = readJsonFromStorage<Order[]>(ORDERS_KEY);
  const localCurrentSession = readJsonFromStorage<DailySession | null>(
    CURRENT_SESSION_KEY,
  );
  const localSessionsHistory = readJsonFromStorage<DailySession[]>(
    SESSIONS_HISTORY_KEY,
  );

  return {
    orders:
      localOrders && Array.isArray(localOrders)
        ? localOrders.map((item, index) => sanitizeOrder(item, index))
        : MOCK_ORDERS,
    currentSession: localCurrentSession
      ? sanitizeDailySession(localCurrentSession, 0)
      : null,
    sessionsHistory:
      localSessionsHistory && Array.isArray(localSessionsHistory)
        ? localSessionsHistory.map((item, index) =>
            sanitizeDailySession(item, index),
          )
        : [],
  };
}

async function fetchOrdersFromApi(pin?: string): Promise<Order[]> {
  const response = await authenticatedApiFetch('/orders', {}, pin);
  if (!response.ok) {
    throw new Error(`Failed to fetch orders from API (${response.status})`);
  }
  const data = (await response.json()) as Array<Partial<Order>>;
  const list = Array.isArray(data) ? data : [];
  return list.map((item, index) => sanitizeOrder(item, index));
}

async function fetchSessionsFromApiAuthenticated(
  pin?: string,
): Promise<{
  currentSession: DailySession | null;
  sessionsHistory: DailySession[];
}> {
  const [currentRes, historyRes] = await Promise.all([
    authenticatedApiFetch('/sessions/current', {}, pin),
    authenticatedApiFetch('/sessions', {}, pin),
  ]);

  if (!currentRes.ok) {
    throw new Error(`Failed to fetch current session from API (${currentRes.status})`);
  }
  if (!historyRes.ok) {
    throw new Error(`Failed to fetch sessions history from API (${historyRes.status})`);
  }

  const currentRaw = (await currentRes.json()) as Partial<DailySession> | null;
  const historyRaw = (await historyRes.json()) as Array<Partial<DailySession>>;

  return {
    currentSession: currentRaw ? sanitizeDailySession(currentRaw, 0) : null,
    sessionsHistory: (Array.isArray(historyRaw) ? historyRaw : []).map((item, index) =>
      sanitizeDailySession(item, index),
    ),
  };
}

export async function loadOrdersState(pin?: string): Promise<OrdersState> {
  const local = getLocalOrdersState();
  if (getDataSourceMode() === 'api') {
    try {
      const [apiOrders, apiSessions] = await Promise.all([
        fetchOrdersFromApi(pin),
        fetchSessionsFromApiAuthenticated(pin),
      ]);

      const next: OrdersState = {
        orders: apiOrders.length > 0 || local.orders.length === 0 ? apiOrders : local.orders,
        currentSession: apiSessions.currentSession ?? local.currentSession,
        sessionsHistory:
          apiSessions.sessionsHistory.length > 0 || local.sessionsHistory.length === 0
            ? apiSessions.sessionsHistory
            : local.sessionsHistory,
      };

      writeJsonToStorage(ORDERS_KEY, next.orders);
      writeJsonToStorage(CURRENT_SESSION_KEY, next.currentSession);
      writeJsonToStorage(SESSIONS_HISTORY_KEY, next.sessionsHistory);

      setDomainDataSourceStatus('orders', 'api');
      setDomainDataSourceStatus('sessions', 'api');
      return next;
    } catch {
      setDomainDataSourceStatus('orders', 'fallback');
      setDomainDataSourceStatus('sessions', 'fallback');
      return local;
    }
  }

  setDomainDataSourceStatus('orders', 'local');
  setDomainDataSourceStatus('sessions', 'local');
  return local;
}

export async function saveOrdersState(state: OrdersState): Promise<void> {
  writeJsonToStorage(ORDERS_KEY, state.orders);
  writeJsonToStorage(CURRENT_SESSION_KEY, state.currentSession);
  writeJsonToStorage(SESSIONS_HISTORY_KEY, state.sessionsHistory);
}

async function executeOrderOfflineOperation(
  operation: OfflineOperation<CreateOrderWritePayload>,
  pin?: string,
): Promise<void> {
  const response = await authenticatedApiFetch(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify({
        ...operation.payload,
        idempotencyKey: operation.operationId,
      }),
    },
    pin,
  );

  if (!response.ok) {
    throw new Error(`Failed to create order via API (${response.status})`);
  }
}

async function executeSessionOfflineOperation(
  operation: OfflineOperation<OpenSessionWritePayload | CloseSessionWritePayload>,
  pin?: string,
): Promise<void> {
  if (operation.action === 'open_session') {
    const response = await authenticatedApiFetch(
      '/sessions/open',
      {
        method: 'POST',
        body: JSON.stringify(operation.payload),
      },
      pin,
    );
    if (!response.ok) {
      throw new Error(`Failed to open session via API (${response.status})`);
    }
    return;
  }

  if (operation.action === 'close_session') {
    const response = await authenticatedApiFetch(
      '/sessions/close',
      {
        method: 'POST',
        body: JSON.stringify(operation.payload),
      },
      pin,
    );
    if (!response.ok) {
      throw new Error(`Failed to close session via API (${response.status})`);
    }
    return;
  }

  throw new Error(`Unsupported session action: ${operation.action}`);
}

export async function writeOrderApiFirstOrQueue(
  payload: CreateOrderWritePayload,
  pin?: string,
): Promise<{ queued: boolean; synced: boolean; operationId: string }> {
  if (getDataSourceMode() !== 'api') {
    setDomainDataSourceStatus('orders', 'local');
    return { queued: false, synced: false, operationId: 'local-mode' };
  }

  const operation = createOfflineOperation({
    domain: 'orders',
    action: 'create_order',
    payload,
  });

  try {
    await executeOrderOfflineOperation(operation, pin);
    setDomainDataSourceStatus('orders', 'api');
    return { queued: false, synced: true, operationId: operation.operationId };
  } catch {
    await enqueueOfflineOperation(offlineQueueStore, operation);
    setDomainDataSourceStatus('orders', 'fallback');
    return { queued: true, synced: false, operationId: operation.operationId };
  }
}

export async function writeSessionOpenApiFirstOrQueue(
  payload: OpenSessionWritePayload,
  pin?: string,
): Promise<{ queued: boolean; synced: boolean; operationId: string }> {
  if (getDataSourceMode() !== 'api') {
    setDomainDataSourceStatus('sessions', 'local');
    return { queued: false, synced: false, operationId: 'local-mode' };
  }

  const operation = createOfflineOperation({
    domain: 'sessions',
    action: 'open_session',
    payload,
  });

  try {
    await executeSessionOfflineOperation(operation, pin);
    setDomainDataSourceStatus('sessions', 'api');
    return { queued: false, synced: true, operationId: operation.operationId };
  } catch {
    await enqueueOfflineOperation(offlineQueueStore, operation);
    setDomainDataSourceStatus('sessions', 'fallback');
    return { queued: true, synced: false, operationId: operation.operationId };
  }
}

export async function writeSessionCloseApiFirstOrQueue(
  payload: CloseSessionWritePayload,
  pin?: string,
): Promise<{ queued: boolean; synced: boolean; operationId: string }> {
  if (getDataSourceMode() !== 'api') {
    setDomainDataSourceStatus('sessions', 'local');
    return { queued: false, synced: false, operationId: 'local-mode' };
  }

  const operation = createOfflineOperation({
    domain: 'sessions',
    action: 'close_session',
    payload,
  });

  try {
    await executeSessionOfflineOperation(operation, pin);
    setDomainDataSourceStatus('sessions', 'api');
    return { queued: false, synced: true, operationId: operation.operationId };
  } catch {
    await enqueueOfflineOperation(offlineQueueStore, operation);
    setDomainDataSourceStatus('sessions', 'fallback');
    return { queued: true, synced: false, operationId: operation.operationId };
  }
}

export async function replayPendingOrderWrites(pin?: string): Promise<void> {
  if (getDataSourceMode() !== 'api') return;

  await replayOfflineQueue(offlineQueueStore, async (operation) => {
    if (operation.domain === 'orders' && operation.action === 'create_order') {
      await executeOrderOfflineOperation(
        operation as OfflineOperation<CreateOrderWritePayload>,
        pin,
      );
      return;
    }

    if (operation.domain === 'sessions') {
      await executeSessionOfflineOperation(
        operation as OfflineOperation<OpenSessionWritePayload | CloseSessionWritePayload>,
        pin,
      );
    }
  });
}
