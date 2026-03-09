
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem, PaymentMethod, ServiceMode, DailySession } from '../types';
import { buildGlobalBackupPayload, calculerTotaux, saveAutoBackup } from '../utils';
import {
  getLocalOrdersState,
  loadOrdersState,
  replayPendingOrderWrites,
  saveOrdersState,
  writeOrderApiFirstOrQueue,
  writeSessionCloseApiFirstOrQueue,
  writeSessionOpenApiFirstOrQueue,
} from '../data/ordersDataAdapter';
import { useSettings } from './SettingsContext';

interface OrderContextType {
  orders: Order[];
  currentSession: DailySession | null;
  sessionsHistory: DailySession[];
  addOrder: (items: CartItem[], total: number, paymentMethod: PaymentMethod, serviceMode: ServiceMode, customerId?: string) => void;
  openSession: (initialCash: number) => void;
  closeSession: (finalCash: number) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useSettings();
  const localState = getLocalOrdersState();
  const [orders, setOrders] = useState<Order[]>(localState.orders);
  const [currentSession, setCurrentSession] = useState<DailySession | null>(localState.currentSession);
  const [sessionsHistory, setSessionsHistory] = useState<DailySession[]>(localState.sessionsHistory);

  useEffect(() => {
    void saveOrdersState({ orders, currentSession, sessionsHistory });
  }, [orders, currentSession, sessionsHistory]);

  useEffect(() => {
    let mounted = true;
    void loadOrdersState().then((state) => {
      if (!mounted) return;
      setOrders(state.orders);
      setCurrentSession(state.currentSession);
      setSessionsHistory(state.sessionsHistory);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onOnline = () => {
      void replayPendingOrderWrites(currentUser?.pin);
    };

    window.addEventListener('online', onOnline);
    void replayPendingOrderWrites(currentUser?.pin);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [currentUser?.pin]);

  const openSession = (initialCash: number) => {
    const startTime = Date.now();
    const newSession: DailySession = {
      id: crypto.randomUUID(),
      startTime,
      initialCash,
      totalSales: 0,
      totalExpenses: 0,
      ordersCount: 0,
      status: 'OPEN',
      salesByMethod: { CASH: 0, CARD: 0, TR: 0 },
      vatSummary: {}
    };
    setCurrentSession(newSession);
    void writeSessionOpenApiFirstOrQueue(
      {
        initialCash,
        startTime,
      },
      currentUser?.pin,
    );
  };

  const closeSession = (finalCash: number) => {
    if (!currentSession) return;
    const safeFinalCash = Number.isFinite(finalCash) ? finalCash : 0;
    const endTime = Date.now();

    const closedSession: DailySession = {
      ...currentSession,
      endTime,
      finalCash: safeFinalCash,
      status: 'CLOSED'
    };

    const nextSessionsHistory = [closedSession, ...sessionsHistory];
    const backupPayload = buildGlobalBackupPayload({
      reason: 'session_close',
      overrides: {
        molls_current_session: null,
        molls_sessions_history: nextSessionsHistory,
      },
    });

    try {
      saveAutoBackup(backupPayload);
    } catch {
      // Backup should never block session closure.
    }
    setSessionsHistory(nextSessionsHistory);
    setCurrentSession(null);
    void writeSessionCloseApiFirstOrQueue(
      {
        sessionId: currentSession.id,
        finalCash: safeFinalCash,
        endTime,
        expectedTotals: {
          totalSales: currentSession.totalSales,
          ordersCount: currentSession.ordersCount,
          totalExpenses: currentSession.totalExpenses,
        },
      },
      currentUser?.pin,
    );
  };

  const addOrder = (items: CartItem[], total: number, paymentMethod: PaymentMethod, serviceMode: ServiceMode, customerId?: string) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: `${orders.length + 101}`,
      timestamp: Date.now(),
      items,
      total,
      status: 'PENDING',
      paymentMethod,
      serviceMode,
      customerId
    };
    setOrders(prev => [newOrder, ...prev]);

    const orderWritePayload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variantName: item.selectedVariant?.name,
        isRedeemed: item.isRedeemed,
        redeemedPoints: item.isRedeemed ? 100 : undefined,
      })),
      total,
      paymentMethod,
      serviceMode,
      customerId,
    };
    void writeOrderApiFirstOrQueue(orderWritePayload, currentUser?.pin);

    if (currentSession) {
      const orderTotals = calculerTotaux(items);
      setCurrentSession(prev => {
        if (!prev) return null;
        const newSalesByMethod = { ...prev.salesByMethod };
        newSalesByMethod[paymentMethod] = (newSalesByMethod[paymentMethod] || 0) + total;
        
        const newVatSummary = { ...prev.vatSummary };
        Object.entries(orderTotals.detailTVA).forEach(([rate, data]) => {
          if (!newVatSummary[rate]) newVatSummary[rate] = { baseHT: 0, amountTVA: 0 };
          newVatSummary[rate].baseHT += data.baseHT;
          newVatSummary[rate].amountTVA += data.montantTVA;
        });

        return {
          ...prev,
          totalSales: prev.totalSales + total,
          ordersCount: prev.ordersCount + 1,
          salesByMethod: newSalesByMethod,
          vatSummary: newVatSummary
        };
      });
    }
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const allowedStatuses: Order['status'][] = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <OrderContext.Provider value={{
      orders, currentSession, sessionsHistory,
      addOrder, openSession, closeSession, updateOrderStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};
