
import React from 'react';
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Contexts
import { useOrders } from '../contexts/OrderContext';

const KDS: React.FC = () => {
  const { orders, updateOrderStatus } = useOrders();

  const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING')
                             .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="p-8 space-y-8 h-full flex flex-col overflow-hidden bg-[#F1F3F6]">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Cuisine (KDS)</h1>
          <p className="text-gray-500 font-medium">Gestion des commandes en préparation.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-[#b3247e] rounded-full animate-pulse"></div>
          <span className="font-black text-xs uppercase tracking-widest text-gray-800">{activeOrders.length} Commandes</span>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-6 h-full min-w-max">
          {activeOrders.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
              <ChefHat size={64} strokeWidth={1} />
              <p className="font-black text-xs uppercase tracking-widest">Aucune commande en attente</p>
            </div>
          ) : activeOrders.map(order => (
            <div 
              key={order.id} 
              data-testid="kds-order-card"
              className={`w-80 flex flex-col bg-white rounded-[2.5rem] shadow-xl border-t-8 overflow-hidden animate-in slide-in-from-bottom-4 ${
                order.status === 'PREPARING' ? 'border-[#b3247e]' : 'border-gray-200'
              }`}
            >
              <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tighter">#{order.orderNumber}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mt-1">
                    <Clock size={12} /> {formatDistanceToNow(order.timestamp, { addSuffix: true, locale: fr })}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${
                  order.serviceMode === 'DINE_IN' ? 'bg-green-50 text-[#54bb24]' : 'bg-pink-50 text-[#b3247e]'
                }`}>
                  {order.serviceMode === 'DINE_IN' ? 'Sur Place' : 'Emporter'}
                </span>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start group">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg font-black text-xs text-gray-500">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                        {item.selectedVariant && (
                          <p className="text-[10px] font-black text-[#b3247e] uppercase">{item.selectedVariant.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 mt-auto">
                {order.status === 'PENDING' ? (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    <Utensils size={16} /> Commencer
                  </button>
                ) : (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="w-full bg-[#54bb24] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#449c1d] transition-all"
                  >
                    <CheckCircle size={16} /> Terminer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KDS;
