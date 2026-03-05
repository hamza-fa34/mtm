
import React from 'react';
import { LayoutDashboard, ShoppingCart, ChefHat, Package, Users, Settings, Utensils, ClipboardList, Wallet, Moon, LogOut } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useInventory } from '../context/InventoryContext';

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, truckSettings, currentUser, logout, hasPermission } = useSettings();
  const { ingredients } = useInventory();
  
  const criticalStocksCount = ingredients.filter(i => i.currentStock <= i.minStock).length;

  const sections = [
    {
      title: 'OPÉRATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'MANAGER' },
        { id: 'pos', label: 'Caisse (POS)', icon: ShoppingCart, role: 'STAFF' },
        { id: 'kds', label: 'Cuisine (KDS)', icon: ChefHat, role: 'STAFF' },
        { id: 'session', label: 'Clôture (Z)', icon: Moon, role: 'MANAGER' },
      ]
    },
    {
      title: 'GESTION MÉTIER',
      items: [
        { id: 'menu', label: 'Menu & Recettes', icon: Utensils, role: 'MANAGER' },
        { id: 'inventory', label: 'Stocks & Achats', icon: Package, role: 'MANAGER', badge: criticalStocksCount > 0 ? criticalStocksCount : undefined },
        { id: 'customers', label: 'Clients & Fidélité', icon: Users, role: 'STAFF' },
      ]
    },
    {
      title: 'FINANCE & ADMIN',
      items: [
        { id: 'reports', label: 'Rapports & Ventes', icon: ClipboardList, role: 'MANAGER' },
        { id: 'expenses', label: 'Dépenses', icon: Wallet, role: 'MANAGER' },
        { id: 'settings', label: 'Paramètres', icon: Settings, role: 'MANAGER' },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#b3247e] text-white flex flex-col h-screen overflow-hidden shrink-0 shadow-2xl z-30">
      <div className="p-8 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
          <ChefHat size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-xl leading-none tracking-tighter truncate w-32">{truckSettings.name.split(' ')[0]}</span>
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">{truckSettings.name.split(' ').slice(1).join(' ') || 'Manager'}</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto scrollbar-hide mt-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => hasPermission(item.role as any));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="px-4 text-[10px] font-black text-white/40 mb-4 tracking-[0.3em] uppercase">{section.title}</p>
              <div className="space-y-1.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                        isActive 
                        ? 'bg-white text-[#b3247e] shadow-xl shadow-black/20 font-black scale-[1.02]' 
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                      <span className="text-sm flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/20">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="bg-black/20 p-4 rounded-3xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#54bb24] flex items-center justify-center font-black text-xs text-white uppercase">
            {currentUser?.name.charAt(0)}{currentUser?.name.split(' ')[1]?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate">{currentUser?.name}</p>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{currentUser?.role}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
