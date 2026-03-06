
import React, { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Wallet, Power, ArrowUpRight, ArrowDownRight, Package, Users, Utensils } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrix, calculerTotaux } from '../utils';

// Contexts
import { useOrders } from '../contexts/OrderContext';
import { useInventory } from '../contexts/InventoryContext';
import { useSettings } from '../contexts/SettingsContext';

const Dashboard: React.FC = () => {
  const { orders, sessionsHistory } = useOrders();
  const { ingredients } = useInventory();
  const { setCurrentView } = useSettings();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = orders.length;
    const avgBasket = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Calcul de la TVA totale
    const totalVAT = orders.reduce((acc, o) => {
      const { totalTVA } = calculerTotaux(o.items);
      return acc + totalTVA;
    }, 0);

    // Données pour le graphique de CA sur les 7 dernières sessions
    const last7Sessions = [...sessionsHistory].slice(0, 7).reverse();
    const chartData = last7Sessions.map(session => ({
      name: new Date(session.startTime).toLocaleDateString('fr-FR', { weekday: 'short' }),
      sales: session.totalSales,
      orders: session.ordersCount
    }));

    // Si pas assez de sessions, on complète avec des données vides pour le look
    while (chartData.length < 7) {
      chartData.unshift({ name: '-', sales: 0, orders: 0 });
    }

    // Top Produits (basé sur les commandes actuelles pour l'exemple)
    const productSales: Record<string, { name: string, qty: number, total: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.product.name, qty: 0, total: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].total += item.totalPrice;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalSales, orderCount, avgBasket, totalVAT, chartData, topProducts };
  }, [orders, sessionsHistory]);

  const criticalIngredients = ingredients.filter(i => i.currentStock <= i.minStock);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full scrollbar-hide">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-800">Performance</h1>
          <p className="text-gray-500 font-medium">Analyse globale de l'activité du truck.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('session')}
            className="bg-white border-2 border-[#b3247e] text-[#b3247e] px-6 py-2.5 rounded-xl font-bold hover:bg-pink-50 transition flex items-center gap-2 uppercase text-xs tracking-widest"
          >
            <Power size={18} /> Gérer la Session
          </button>
          <button 
            onClick={() => setCurrentView('pos')}
            className="bg-[#b3247e] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#a11d6e] transition shadow-xl shadow-pink-100 flex items-center gap-2 uppercase text-xs tracking-widest"
          >
            <ShoppingBag size={18} /> Nouvelle Vente
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Chiffre d\'Affaires', value: formatPrix(stats.totalSales), icon: Wallet, color: 'text-[#54bb24]', bg: 'bg-green-50', trend: '+12%', isUp: true },
          { label: 'Panier Moyen', value: formatPrix(stats.avgBasket), icon: ShoppingBag, color: 'text-[#b3247e]', bg: 'bg-pink-50', trend: '+5%', isUp: true },
          { label: 'Commandes', value: stats.orderCount, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '-2%', isUp: false },
          { label: 'TVA Collectée', value: formatPrix(stats.totalVAT), icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+8%', isUp: true },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`${kpi.bg} p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black mt-1 text-gray-800">{kpi.value}</h3>
              <span className={`text-[10px] font-black flex items-center ${kpi.isUp ? 'text-[#54bb24]' : 'text-red-500'}`}>
                {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest">Évolution du CA (7 derniers jours)</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#b3247e]"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase">Ventes</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={100}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b3247e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#b3247e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 'bold', padding: '16px' }}
                    cursor={{ stroke: '#b3247e', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#b3247e" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-8">Top 5 Produits</h3>
          <div className="space-y-6">
            {stats.topProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic text-sm">
                Pas encore de données.
              </div>
            ) : stats.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-[#b3247e] group-hover:bg-pink-50 transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800">{product.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{product.qty} ventes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-800">{formatPrix(product.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Critical Stocks */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest">Alertes Stocks</h3>
            <button onClick={() => setCurrentView('inventory')} className="text-[10px] font-black text-[#b3247e] uppercase tracking-widest hover:underline">Voir tout</button>
          </div>
          <div className="space-y-4">
            {criticalIngredients.length === 0 ? (
              <div className="p-8 bg-green-50 rounded-[2rem] flex items-center gap-4">
                <div className="w-12 h-12 bg-[#54bb24] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">Tout est en ordre !</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Aucune rupture de stock détectée.</p>
                </div>
              </div>
            ) : criticalIngredients.map(ing => (
              <div key={ing.id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-800">{ing.name}</p>
                    <p className="text-[10px] font-bold text-red-400 uppercase">Stock: {ing.currentStock} {ing.unit}</p>
                  </div>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg text-red-500 font-black text-[10px] uppercase tracking-widest shadow-sm">
                  Critique
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -mr-20 -mt-20"></div>
          <h3 className="text-2xl font-black mb-8 tracking-tighter uppercase relative z-10">Actions Rapides</h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button onClick={() => setCurrentView('pos')} className="bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group">
              <div className="w-12 h-12 bg-[#b3247e] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Vendre</span>
            </button>
            <button onClick={() => setCurrentView('inventory')} className="bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group">
              <div className="w-12 h-12 bg-[#54bb24] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Stocks</span>
            </button>
            <button onClick={() => setCurrentView('menu')} className="bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Utensils size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Menu</span>
            </button>
            <button onClick={() => setCurrentView('customers')} className="bg-white/10 hover:bg-white/20 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Clients</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
