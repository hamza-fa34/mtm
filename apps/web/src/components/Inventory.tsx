
import React, { useState } from 'react';
import { Package, Plus, ShoppingCart, Trash2, AlertCircle, History, TrendingUp, ArrowRight, Wallet, Search } from 'lucide-react';
import { Ingredient, Purchase, Waste } from '../types';
import { formatPrix, formatDate } from '../utils';

// Contexts
import { useInventory } from '../contexts/InventoryContext';

const Inventory: React.FC = () => {
  const { ingredients, wastes, addIngredient, addPurchase, addWaste } = useInventory();
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showAddIngModal, setShowAddIngModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newPurchase, setNewPurchase] = useState<Omit<Purchase, 'id'>>({
    ingredientId: '',
    quantity: 0,
    totalPrice: 0,
    date: Date.now(),
    supplierName: ''
  });

  const [newWaste, setNewWaste] = useState<Omit<Waste, 'id'>>({
    ingredientId: '',
    quantity: 0,
    reason: 'Autre',
    date: Date.now()
  });

  const [newIng, setNewIng] = useState<Omit<Ingredient, 'id'>>({
    name: '',
    unit: 'kg',
    currentStock: 0,
    minStock: 1,
    costPrice: 0,
    category: 'PRODUITS_FRAIS'
  });

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalValue: ingredients.reduce((acc, ing) => acc + (ing.currentStock * ing.costPrice), 0),
    criticalCount: ingredients.filter(ing => ing.currentStock <= ing.minStock).length,
    wasteValue: wastes.reduce((acc, w) => {
      const ing = ingredients.find(i => i.id === w.ingredientId);
      return acc + (w.quantity * (ing?.costPrice || 0));
    }, 0)
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Stocks & Achats</h1>
          <p className="text-gray-500 font-medium">Gérez vos matières premières et vos approvisionnements.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddIngModal(true)}
            className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-gray-300 transition-all"
          >
            Nouvel Ingrédient
          </button>
          <button 
            onClick={() => { setNewPurchase({...newPurchase, ingredientId: ingredients[0]?.id || ''}); setShowPurchaseModal(true); }}
            className="bg-[#b3247e] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Enregistrer Achat
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Valeur du Stock', value: formatPrix(stats.totalValue), icon: Wallet, color: 'text-[#b3247e]', bg: 'bg-pink-50' },
          { label: 'Alertes Rupture', value: stats.criticalCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Pertes (Mois)', value: formatPrix(stats.wasteValue), icon: Trash2, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className={`${kpi.bg} p-4 rounded-2xl`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-2xl font-black text-gray-800">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un ingrédient..." 
              className="pl-12 pr-6 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold text-sm w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setNewWaste({...newWaste, ingredientId: ingredients[0]?.id || ''}); setShowWasteModal(true); }}
            className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
          >
            Déclarer une perte
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">Ingrédient</th>
              <th className="px-8 py-6">Catégorie</th>
              <th className="px-8 py-6 text-right">Stock Actuel</th>
              <th className="px-8 py-6 text-right">Prix Moyen</th>
              <th className="px-8 py-6 text-right">Valeur</th>
              <th className="px-8 py-6">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredIngredients.map(ing => {
              const isCritical = ing.currentStock <= ing.minStock;
              return (
                <tr key={ing.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-800">{ing.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Unité: {ing.unit}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-lg text-gray-500 uppercase tracking-widest">
                      {typeof ing.category === 'string' ? ing.category.replace('_', ' ') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-gray-800">{ing.currentStock} {ing.unit}</td>
                  <td className="px-8 py-6 text-right font-bold text-gray-400">{formatPrix(ing.costPrice)}</td>
                  <td className="px-8 py-6 text-right font-black text-[#b3247e]">{formatPrix(ing.currentStock * ing.costPrice)}</td>
                  <td className="px-8 py-6">
                    {isCritical ? (
                      <span className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-widest">
                        <AlertCircle size={14} /> Critique
                      </span>
                    ) : (
                      <span className="text-[#54bb24] font-black text-[10px] uppercase tracking-widest">Optimal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals for Purchase, Waste, AddIngredient would go here - simplified for brevity */}
      {showAddIngModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase mb-8">Nouvel Ingrédient</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nom" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Unité (kg, l, pce)" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newIng.unit} onChange={e => setNewIng({...newIng, unit: e.target.value})} />
                <input type="number" placeholder="Stock Min" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newIng.minStock} onChange={e => setNewIng({...newIng, minStock: parseFloat(e.target.value)})} />
              </div>
              <button 
                onClick={() => { addIngredient(newIng); setShowAddIngModal(false); }}
                className="w-full bg-[#b3247e] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-100"
              >
                Créer l'ingrédient
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase mb-8">Enregistrer Achat</h2>
            <div className="space-y-4">
              <select className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newPurchase.ingredientId} onChange={e => setNewPurchase({...newPurchase, ingredientId: e.target.value})}>
                {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Quantité" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newPurchase.quantity} onChange={e => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Prix Total TTC" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={newPurchase.totalPrice} onChange={e => setNewPurchase({...newPurchase, totalPrice: parseFloat(e.target.value)})} />
              </div>
              <button 
                onClick={() => { addPurchase(newPurchase); setShowPurchaseModal(false); }}
                className="w-full bg-[#54bb24] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-100"
              >
                Valider l'achat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
