
import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import KDS from './components/KDS';
import Inventory from './components/Inventory';
import CRM from './components/CRM';
import MenuManager from './components/MenuManager';
import SettingsView from './components/SettingsView';
import ExpensesView from './components/ExpensesView';
import EndOfDay from './components/EndOfDay';
import { Lock } from 'lucide-react';

// Contexts
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { OrderProvider, useOrders } from './context/OrderContext';
import { ProductProvider, useProducts } from './context/ProductContext';
import { CustomerProvider, useCustomers } from './context/CustomerContext';

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, isLocked, pin, handlePinInput, setIsLocked, hasPermission } = useSettings();
  const { currentSession, orders } = useOrders();
  
  // Expenses are still simple enough to keep here or we could make an ExpenseContext
  const [expenses, setExpenses] = React.useState(() => {
    const saved = localStorage.getItem('molls_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('molls_expenses', JSON.stringify(expenses));
  }, [expenses]);

  if (isLocked) {
    return (
      <div className="h-screen w-screen bg-[#b3247e] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/20 shadow-2xl flex flex-col items-center w-full max-sm:max-w-xs max-w-sm">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#b3247e] mb-8 shadow-xl">
            <Lock size={32} />
          </div>
          <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-2">Accès Sécurisé</h2>
          <p className="text-white/60 font-bold text-xs uppercase tracking-widest mb-8 text-center">Entrez votre code PIN (1234)</p>
          
          <div className="flex gap-4 mb-10">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 border-white transition-all ${pin.length > i ? 'bg-white scale-125 shadow-lg shadow-white/50' : 'bg-transparent'}`}></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => handlePinInput(n.toString())} className="w-full aspect-square rounded-2xl bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-[#b3247e] transition-all active:scale-90">{n}</button>
            ))}
            <button className="col-start-2 aspect-square rounded-2xl bg-white/10 text-white font-black text-2xl hover:bg-white hover:text-[#b3247e] transition-all active:scale-90" onClick={() => handlePinInput('0')}>0</button>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    // Restriction de sécurité supplémentaire au niveau du rendu
    const isManagerView = ['dashboard', 'inventory', 'menu', 'expenses', 'session', 'settings', 'reports'].includes(currentView);
    if (isManagerView && !hasPermission('MANAGER')) {
      setCurrentView('pos');
      return <POS />;
    }

    if (!currentSession && (currentView === 'pos' || currentView === 'kds')) {
      return <EndOfDay />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'kds': return <KDS />;
      case 'menu': return <MenuManager />;
      case 'inventory': return <Inventory />;
      case 'customers': return <CRM />;
      case 'expenses': return <ExpensesView expenses={expenses} onAdd={(e) => setExpenses((prev: any) => [...prev, {...e, id: crypto.randomUUID()}])} onDelete={(id) => setExpenses((prev: any) => prev.filter((e: any) => e.id !== id))} />;
      case 'settings': return <SettingsView />;
      case 'session': return <EndOfDay />;
      case 'reports':
        return (
          <div className="p-8 space-y-8 animate-in fade-in overflow-y-auto h-full scrollbar-hide">
             <header className="flex justify-between items-end">
               <div>
                 <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Historique des ventes</h1>
                 <p className="text-gray-500 font-medium">Consultez et exportez l'activité du truck.</p>
               </div>
             </header>
             <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest border-b">
                    <tr><th className="px-8 py-6">Ticket</th><th className="px-8 py-6">Mode</th><th className="px-8 py-6 text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <tr><td colSpan={3} className="p-12 text-center text-gray-300 italic">Aucune vente enregistrée.</td></tr>
                    ) : orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="px-8 py-6 font-black">#{o.orderNumber}</td>
                        <td className="px-8 py-6 uppercase text-[10px] font-black">{o.serviceMode}</td>
                        <td className="px-8 py-6 text-right font-black text-lg">{(o.total || 0).toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        );
      default: return <POS />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F3F6] text-gray-900 overflow-hidden font-['Inter']">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">{renderView()}</main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <InventoryProvider>
        <ProductProvider>
          <CustomerProvider>
            <OrderProvider>
              <AppContent />
            </OrderProvider>
          </CustomerProvider>
        </ProductProvider>
      </InventoryProvider>
    </SettingsProvider>
  );
};

export default App;
