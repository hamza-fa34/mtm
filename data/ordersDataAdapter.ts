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

export function getLocalOrdersState(): OrdersState {
  const localOrders = readJsonFromStorage<Order[]>(ORDERS_KEY);
  const localCurrentSession = readJsonFromStorage<DailySession | null>(
    CURRENT_SESSION_KEY,
  );
  const localSessionsHistory = readJsonFromStorage<DailySession[]>(
    SESSIONS_HISTORY_KEY,
  );

  return {
    orders: localOrders && Array.isArray(localOrders) ? localOrders : MOCK_ORDERS,
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
  const data = (await response.json()) as Order[];
  return Array.isArray(data) ? data : [];
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
