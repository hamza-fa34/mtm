
import React, { useState } from 'react';
import { UserPlus, Search, Gift, History, Star, Phone, Mail, X, Save } from 'lucide-react';
import { Customer } from '../types';
import { formatDate } from '../utils';

// Contexts
import { useCustomers } from '../contexts/CustomerContext';
import { useOrders } from '../contexts/OrderContext';

const CRM: React.FC = () => {
  const { customers, addCustomer } = useCustomers();
  const { orders } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'loyaltyPoints'>>({
    name: '',
    email: '',
    phone: '',
    lastVisit: Date.now()
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const customerOrders = selectedCustomer 
    ? orders.filter(o => o.customerId === selectedCustomer.id)
    : [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(newCustomer);
    setShowAddModal(false);
    setNewCustomer({ name: '', email: '', phone: '', lastVisit: Date.now() });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Clients & Fidélité</h1>
          <p className="text-gray-500 font-medium">Gérez votre base client et récompensez vos habitués.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#b3247e] text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-pink-100 hover:scale-105 transition-transform"
        >
          <UserPlus size={20} /> Nouveau Client
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher par nom, email ou téléphone..." 
                  className="pl-12 pr-6 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-6">Client</th>
                  <th className="px-8 py-6">Contact</th>
                  <th className="px-8 py-6 text-right">Points</th>
                  <th className="px-8 py-6 text-right">Dernière Visite</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-50 text-[#b3247e] rounded-xl flex items-center justify-center font-black text-xs">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-black text-gray-800">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Mail size={12} /> {customer.email || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Phone size={12} /> {customer.phone || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="bg-green-50 text-[#54bb24] px-3 py-1 rounded-lg font-black text-xs">
                        {customer.loyaltyPoints} PTS
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right text-xs font-bold text-gray-400">
                      {formatDate(customer.lastVisit)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 text-gray-300 hover:text-[#b3247e] transition-colors"
                      >
                        <History size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {selectedCustomer ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 sticky top-8 animate-in slide-in-from-right-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#b3247e] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-pink-100">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{selectedCustomer.name}</h2>
                    <p className="text-xs font-bold text-[#54bb24] uppercase tracking-widest">{selectedCustomer.loyaltyPoints} points fidélité</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Historique d'achats</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                    {customerOrders.length > 0 ? customerOrders.map((order, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-black text-gray-800">#{order.orderNumber}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{formatDate(order.timestamp)}</p>
                        </div>
                        <span className="font-black text-gray-800 text-sm">{(order.total || 0).toFixed(2)}€</span>
                      </div>
                    )) : <p className="text-xs italic text-gray-400 text-center py-4">Aucun achat enregistré</p>}
                  </div>
                </div>

                <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#b3247e] shadow-sm">
                    <Gift size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#b3247e] uppercase tracking-widest">Prochaine récompense</p>
                    <p className="text-sm font-black text-gray-800">{Math.max(0, 100 - selectedCustomer.loyaltyPoints)} points manquants</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <Star size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-black text-xs uppercase tracking-widest">Sélectionnez un client<br/>pour voir son historique</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Nouveau Client</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Complet</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                <input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
              </div>
              
              <button type="submit" className="w-full bg-[#b3247e] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-100 flex items-center justify-center gap-2 hover:bg-[#a11d6e] transition-all">
                <Save size={20} /> Créer le client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
