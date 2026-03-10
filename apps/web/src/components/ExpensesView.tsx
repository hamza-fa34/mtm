
import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, ArrowDownCircle } from 'lucide-react';
import { formatPrix, formatDate, downloadCSV } from '../utils';
import { Expense } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onAdd, onDelete }) => {
  const [label, setLabel] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amountTTC, setAmountTTC] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [category, setCategory] = useState('Énergie & Gaz');
  const [paymentMethod, setPaymentMethod] = useState<'Caisse (Espèces)' | 'Carte Pro' | 'Perso' | 'Virement'>('Carte Pro');
  const [isCapturing, setIsCapturing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    "Énergie & Gaz",
    "Emplacement / Loyer",
    "Matières Premières (Appoint)",
    "Petit Matériel",
    "Entretien Truck",
    "Marketing / Pub",
    "Autre"
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => 
      e.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + e.amountTTC, 0);
    const totalVAT = expenses.reduce((acc, e) => acc + e.vatAmount, 0);
    return { total, totalVAT };
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !amountTTC) return;
    
    const ttc = parseFloat(amountTTC);
    const rate = parseFloat(vatRate) / 100;
    const vat = ttc - (ttc / (1 + rate));

    onAdd({
      label,
      merchant,
      amountTTC: ttc,
      vatAmount: parseFloat(vat.toFixed(2)),
      category,
      paymentMethod,
      date: Date.now(),
      hasReceipt: isCapturing
    });

    setLabel('');
    setMerchant('');
    setAmountTTC('');
    setIsCapturing(false);
  };

  const handleExport = () => {
    const data = expenses.map(e => ({
      Date: formatDate(e.date, 'yyyy-MM-dd HH:mm'),
      Marchand: e.merchant,
      Libelle: e.label,
      Categorie: e.category,
      MoyenPaiement: e.paymentMethod,
      MontantTVA: e.vatAmount,
      MontantTTC: e.amountTTC
    }));
    downloadCSV(data, 'depenses_mollys_truck');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in h-full overflow-y-auto scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Finance & Dépenses</h1>
          <p className="text-gray-500 font-medium">Contrôlez vos sorties d'argent et récupérez votre TVA.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <ArrowDownCircle size={18} /> Export Excel (Compta)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Dépenses (Mois)</p>
          <h3 className="text-3xl font-black text-gray-800">{formatPrix(stats.total)}</h3>
        </div>
        <div className="bg-[#54bb24]/10 p-6 rounded-[2rem] border border-[#54bb24]/20">
          <p className="text-[10px] font-black text-[#54bb24] uppercase tracking-widest mb-1">TVA Récupérable</p>
          <h3 className="text-3xl font-black text-gray-800">{formatPrix(stats.totalVAT)}</h3>
        </div>
        <div className="bg-[#b3247e]/10 p-6 rounded-[2rem] border border-[#b3247e]/20">
          <p className="text-[10px] font-black text-[#b3247e] uppercase tracking-widest mb-1">Sorties de Caisse</p>
          <h3 className="text-3xl font-black text-gray-800">
            {formatPrix(expenses.filter(e => e.paymentMethod === 'Caisse (Espèces)').reduce((acc, e) => acc + e.amountTTC, 0))}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit space-y-6">
          <h2 className="font-black text-xl uppercase text-gray-800 tracking-tight flex items-center gap-2">
            <Plus className="text-[#b3247e]" /> Nouvelle Dépense
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quoi ? (Libellé)</label>
              <input required type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#b3247e] font-bold text-sm border-none" placeholder="Ex: Gaz" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marchand</label>
              <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#b3247e] font-bold text-sm border-none" placeholder="Ex: Station Total" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Montant TTC</label>
                <input required type="number" step="0.01" value={amountTTC} onChange={(e) => setAmountTTC(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#b3247e] font-bold text-sm border-none" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TVA (%)</label>
                <select value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none outline-none">
                  <option value="20">20%</option>
                  <option value="10">10%</option>
                  <option value="5.5">5.5%</option>
                  <option value="0">0%</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poste de dépense</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none outline-none">
                {categories.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none outline-none">
                <option>Carte Pro</option>
                <option>Caisse (Espèces)</option>
                <option>Virement</option>
                <option>Perso</option>
              </select>
            </div>
            <button className="w-full bg-[#b3247e] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-100 active:scale-95 transition-all">
              Enregistrer
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-black text-sm uppercase tracking-[0.2em] text-gray-400">Journal des frais</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Filtrer..." 
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 font-black text-[9px] text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Marchand & Date</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4 text-right">TTC</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan={4} className="p-20 text-center text-gray-300 italic">Aucune dépense.</td></tr>
                ) : [...filteredExpenses].reverse().map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 group">
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-gray-800 leading-none">{exp.merchant}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{formatDate(exp.date, 'dd/MM/yy')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[9px] font-black px-2 py-1 bg-gray-100 text-gray-500 rounded uppercase">{exp.category}</span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-red-600">
                      -{formatPrix(exp.amountTTC)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => onDelete(exp.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;
