import { MOCK_ORDERS } from '../constants';
import { DailySession, Order } from '../types';
import { getApiBaseUrl, getDataSourceMode } from './config';
import { readJsonFromStorage, writeJsonToStorage } from './localStorage';
import { setDomainDataSourceStatus } from './sourceStatus';

const ORDERS_KEY = 'molls_orders';
const CURRENT_SESSION_KEY = 'molls_current_session';
const SESSIONS_HISTORY_KEY = 'molls_sessions_history';

export interface OrdersState {
  orders: Order[];
  currentSession: DailySession | null;
  sessionsHistory: DailySession[];
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
    currentSession: localCurrentSession ?? null,
    sessionsHistory:
      localSessionsHistory && Array.isArray(localSessionsHistory)
        ? localSessionsHistory
        : [],
  };
}

async function fetchOrdersFromApi(): Promise<Order[]> {
  const response = await fetch(`${getApiBaseUrl()}/orders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch orders from API (${response.status})`);
  }
  const data = (await response.json()) as Array<Partial<Order>>;
  const list = Array.isArray(data) ? data : [];
  return list.map((item, index) => sanitizeOrder(item, index));
}

export async function loadOrdersState(): Promise<OrdersState> {
  const local = getLocalOrdersState();
  if (getDataSourceMode() === 'api') {
    try {
      const apiOrders = await fetchOrdersFromApi();
      if (apiOrders.length > 0 || local.orders.length === 0) {
        const next: OrdersState = {
          ...local,
          orders: apiOrders,
        };
        writeJsonToStorage(ORDERS_KEY, next.orders);
        setDomainDataSourceStatus('orders', 'api');
        return next;
      }
      setDomainDataSourceStatus('orders', 'fallback');
      return local;
    } catch {
      setDomainDataSourceStatus('orders', 'fallback');
      return local;
    }
  }

  setDomainDataSourceStatus('orders', 'local');
  return local;
}

export async function saveOrdersState(state: OrdersState): Promise<void> {
  writeJsonToStorage(ORDERS_KEY, state.orders);
  writeJsonToStorage(CURRENT_SESSION_KEY, state.currentSession);
  writeJsonToStorage(SESSIONS_HISTORY_KEY, state.sessionsHistory);
}
