
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Customer } from '../types';
import {
  getLocalCustomers,
  loadCustomers,
  saveCustomers,
} from '../data/customersDataAdapter';

interface CustomerContextType {
  customers: Customer[];
  updateCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints'>) => void;
  updateLoyaltyPoints: (customerId: string, pointsChange: number) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    return getLocalCustomers();
  });
  const isHydratingRef = useRef(false);

  useEffect(() => {
    if (isHydratingRef.current) {
      isHydratingRef.current = false;
      return;
    }
    void saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    let mounted = true;
    void loadCustomers().then((nextCustomers) => {
      if (!mounted) return;
      isHydratingRef.current = true;
      setCustomers(nextCustomers);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addCustomer = (c: Omit<Customer, 'id' | 'loyaltyPoints'>) => {
    setCustomers(prev => [...prev, { ...c, id: crypto.randomUUID(), loyaltyPoints: 0 }]);
  };

  const updateLoyaltyPoints = (customerId: string, pointsChange: number) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          loyaltyPoints: Math.max(0, c.loyaltyPoints + pointsChange),
          lastVisit: Date.now()
        };
      }
      return c;
    }));
  };

  return (
    <CustomerContext.Provider value={{ customers, updateCustomers: setCustomers, addCustomer, updateLoyaltyPoints }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomers must be used within a CustomerProvider');
  return context;
};
