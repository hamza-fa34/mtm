
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem, PaymentMethod, ServiceMode, DailySession } from '../types';
import { MOCK_ORDERS } from '../constants';
import { buildGlobalBackupPayload, calculerTotaux, saveAutoBackup } from '../utils';

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
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('molls_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  const [currentSession, setCurrentSession] = useState<DailySession | null>(() => {
    const saved = localStorage.getItem('molls_current_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessionsHistory, setSessionsHistory] = useState<DailySession[]>(() => {
    const saved = localStorage.getItem('molls_sessions_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('molls_orders', JSON.stringify(orders));
    localStorage.setItem('molls_current_session', JSON.stringify(currentSession));
    localStorage.setItem('molls_sessions_history', JSON.stringify(sessionsHistory));
  }, [orders, currentSession, sessionsHistory]);

  const openSession = (initialCash: number) => {
    const newSession: DailySession = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      initialCash,
      totalSales: 0,
      totalExpenses: 0,
      ordersCount: 0,
      status: 'OPEN',
      salesByMethod: { CASH: 0, CARD: 0, TR: 0 },
      vatSummary: {}
    };
    setCurrentSession(newSession);
  };

  const closeSession = (finalCash: number) => {
    if (!currentSession) return;
    const safeFinalCash = Number.isFinite(finalCash) ? finalCash : 0;

    const closedSession: DailySession = {
      ...currentSession,
      endTime: Date.now(),
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

    saveAutoBackup(backupPayload);
    setSessionsHistory(nextSessionsHistory);
    setCurrentSession(null);
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
