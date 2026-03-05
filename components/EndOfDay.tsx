
import React, { useState } from 'react';
import { Moon, Play, Square, History, TrendingUp, Banknote, CreditCard, Ticket, Calculator, Download } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrix, formatDate } from '../utils';

const EndOfDay: React.FC = () => {
  const { currentSession, sessionsHistory, openSession, closeSession } = useOrders();
  const { setCurrentView } = useSettings();
  const [initialCash, setInitialCash] = useState(50);
  const [finalCash, setFinalCash] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  if (!currentSession && !showHistory) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl max-w-md w-full text-center space-y-8 border border-gray-100 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-50 text-[#54bb24] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-green-100">
            <Play size={40} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Ouvrir la Caisse</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Prêt pour un nouveau service ?</p>
          </div>
          
          <div className="space-y-4">
            <div className="text-left space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fond de caisse initial (€)</label>
              <input 
                type="number" 
                value={initialCash} 
                onChange={(e) => setInitialCash(parseFloat(e.target.value))}
                className="w-full p-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#54bb24] font-black text-2xl text-center"
              />
            </div>
            <button 
              onClick={() => openSession(initialCash)}
              className="w-full bg-[#54bb24] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:scale-105 transition-all active:scale-95"
            >
              Démarrer le Service
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <History size={14} /> Voir l'historique
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in h-full overflow-y-auto scrollbar-hide">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Historique des Sessions</h1>
            <p className="text-gray-500 font-medium">Consultez vos clôtures passées.</p>
          </div>
          <button 
            onClick={() => setShowHistory(false)}
            className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            Retour
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {sessionsHistory.map(session => (
            <div key={session.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#b3247e] group-hover:text-white transition-colors">
                  <Moon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase tracking-tighter">{formatDate(session.startTime, 'dd MMMM yyyy')}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {formatDate(session.startTime, 'HH:mm')} - {session.endTime ? formatDate(session.endTime, 'HH:mm') : 'En cours'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-12 items-center">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventes</p>
                  <p className="font-black text-gray-800">{formatPrix(session.totalSales)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Commandes</p>
                  <p className="font-black text-gray-800">{session.ordersCount}</p>
                </div>
                <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-[#b3247e] transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}
          {sessionsHistory.length === 0 && (
            <div className="p-20 text-center text-gray-300 italic">Aucune session archivée.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in h-full overflow-y-auto scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Session en cours</h1>
          <p className="text-gray-500 font-medium">Rapport X (Lecture provisoire)</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowHistory(true)}
            className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <History size={18} /> Historique
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            Imprimer Rapport X
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Stats Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <TrendingUp className="text-[#b3247e] mb-4" size={32} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Chiffre d'Affaires</p>
                <p className="text-3xl font-black text-gray-800 tracking-tighter">{formatPrix(currentSession?.totalSales || 0)}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <Calculator className="text-[#54bb24] mb-4" size={32} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Nombre de Tickets</p>
                <p className="text-3xl font-black text-gray-800 tracking-tighter">{currentSession?.ordersCount || 0}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
              <Banknote className="text-blue-500 mb-4" size={32} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Panier Moyen</p>
                <p className="text-3xl font-black text-gray-800 tracking-tighter">
                  {formatPrix((currentSession?.totalSales || 0) / (currentSession?.ordersCount || 1))}
                </p>
              </div>
            </div>
          </div>

          {/* Détail par Paiement */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Banknote className="text-[#b3247e]" /> Répartition des Paiements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#54bb24] shadow-sm">
                    <Banknote size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Espèces</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{formatPrix(currentSession?.salesByMethod['CASH'] || 0)}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#b3247e] shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carte Bancaire</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{formatPrix(currentSession?.salesByMethod['CARD'] || 0)}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                    <Ticket size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titres Resto</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{formatPrix(currentSession?.salesByMethod['TR'] || 0)}</p>
              </div>
            </div>
          </div>

          {/* Détail TVA */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-8">Récapitulatif TVA</h3>
            <table className="w-full">
              <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr className="border-b border-gray-50">
                  <th className="text-left py-4">Taux</th>
                  <th className="text-right py-4">Base HT</th>
                  <th className="text-right py-4">Montant TVA</th>
                  <th className="text-right py-4">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.entries(currentSession?.vatSummary || {}).map(([rate, data]) => {
                  const vatData = data as { baseHT: number, amountTVA: number };
                  return (
                    <tr key={rate} className="text-sm">
                      <td className="py-4 font-black">{rate}%</td>
                      <td className="py-4 text-right font-bold text-gray-500">{formatPrix(vatData.baseHT)}</td>
                      <td className="py-4 text-right font-bold text-gray-500">{formatPrix(vatData.amountTVA)}</td>
                      <td className="py-4 text-right font-black text-gray-800">{formatPrix(vatData.baseHT + vatData.amountTVA)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panneau de Clôture */}
        <div className="space-y-8">
          <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-gray-200 sticky top-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#b3247e]">
                <Square size={28} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Clôture Z</h2>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fin de journée</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Comptage Espèces Final (€)</label>
                <input 
                  type="number" 
                  value={finalCash}
                  onChange={(e) => setFinalCash(parseFloat(e.target.value))}
                  className="w-full bg-transparent border-none outline-none font-black text-3xl text-white text-center"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 font-bold">Fond de caisse initial</span>
                  <span className="font-black">{formatPrix(currentSession?.initialCash || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 font-bold">Ventes Espèces</span>
                  <span className="font-black">{formatPrix(currentSession?.salesByMethod['CASH'] || 0)}</span>
                </div>
                <div className="flex justify-between text-xs pt-3 border-t border-white/10">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Théorique en caisse</span>
                  <span className="font-black text-[#54bb24]">{formatPrix((currentSession?.initialCash || 0) + (currentSession?.salesByMethod['CASH'] || 0))}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  closeSession(finalCash);
                  setCurrentView('dashboard');
                }}
                className="w-full bg-[#b3247e] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-900/20 hover:scale-105 transition-all active:scale-95 mt-4"
              >
                Clôturer la Journée
              </button>
              <p className="text-[9px] text-center text-white/30 font-bold uppercase tracking-widest">
                Attention : Cette action est irréversible et archivera les données.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndOfDay;
