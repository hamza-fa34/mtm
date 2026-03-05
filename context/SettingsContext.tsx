
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface TruckSettings {
  name: string;
  slogan: string;
  tvaEmporter: number;
  tvaPlace: number;
}

interface SettingsContextType {
  truckSettings: TruckSettings;
  setTruckSettings: (settings: TruckSettings) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  pin: string;
  handlePinInput: (num: string) => void;
  currentUser: User | null;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  removeUser: (id: string) => void;
  hasPermission: (role: UserRole) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState('pos');
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('molls_users');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Manager', pin: '1234', role: 'MANAGER' },
      { id: '2', name: 'Staff', pin: '0000', role: 'STAFF' }
    ];
  });

  const [truckSettings, setTruckSettings] = useState<TruckSettings>(() => {
    const saved = localStorage.getItem('molls_settings');
    return saved ? JSON.parse(saved) : { 
      name: "Molly's Truck", 
      slogan: "Les meilleurs burgers de la ville !", 
      tvaEmporter: 5.5, 
      tvaPlace: 10 
    };
  });

  useEffect(() => {
    localStorage.setItem('molls_settings', JSON.stringify(truckSettings));
    localStorage.setItem('molls_users', JSON.stringify(users));
  }, [truckSettings, users]);

  const handlePinInput = (num: string) => {
    const newPin = pin + num;
    const user = users.find(u => u.pin === newPin);
    
    if (user) {
      setCurrentUser(user);
      setIsLocked(false);
      setPin('');
      // Rediriger vers POS par défaut pour le staff, Dashboard pour le manager
      setCurrentView(user.role === 'MANAGER' ? 'dashboard' : 'pos');
    } else if (newPin.length >= 4) {
      setPin('');
    } else {
      setPin(newPin);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLocked(true);
    setPin('');
  };

  const addUser = (user: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...user, id: crypto.randomUUID() }]);
  };

  const removeUser = (id: string) => {
    if (users.length <= 1) return; // Garder au moins un utilisateur
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const hasPermission = (requiredRole: UserRole) => {
    if (!currentUser) return false;
    if (currentUser.role === 'MANAGER') return true;
    return currentUser.role === requiredRole;
  };

  return (
    <SettingsContext.Provider value={{
      truckSettings, setTruckSettings,
      currentView, setCurrentView,
      isLocked, setIsLocked,
      pin, handlePinInput,
      currentUser, logout,
      users, addUser, removeUser,
      hasPermission
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
