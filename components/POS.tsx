
import React, { useState, useMemo } from 'react';
import { Search, Plus, ShoppingCart, CreditCard, Banknote, Ticket, Truck, UtensilsCrossed, Gift, X, AlertTriangle } from 'lucide-react';
import { Product, CartItem, ServiceMode, PaymentMethod, Variant } from '../types';
import { calculerTotaux, formatPrix } from '../utils';

// Contexts
import { useCategories } from '../context/CategoryContext';
import { useInventory } from '../context/InventoryContext';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { useCustomers } from '../context/CustomerContext';

const POS: React.FC = () => {
  const { categories } = useCategories();
  const { ingredients, getProductStockStatus, reduceStock } = useInventory();
  const { addOrder, currentSession } = useOrders();
  const { products } = useProducts();
  const { customers, updateLoyaltyPoints } = useCustomers();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [serviceMode, setServiceMode] = useState<ServiceMode>('TAKEAWAY');
  const [isPrinting, setIsPrinting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [variantSelector, setVariantSelector] = useState<Product | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totals = useMemo(() => calculerTotaux(cart), [cart]);

  const handleCheckout = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    if (!currentSession) {
      setCheckoutError('Session fermee: ouvrez une session avant encaissement.');
      return;
    }

    if (!Number.isFinite(totals.totalTTC) || totals.totalTTC < 0) {
      setCheckoutError('Total invalide: verifier le panier.');
      return;
    }

    const hasMissingStock = cart.some((item) =>
      item.product.recipe.some((recipeItem) => {
        const ingredient = ingredients.find((ing) => ing.id === recipeItem.ingredientId);
        if (!ingredient) return true;
        return ingredient.currentStock < recipeItem.quantity * item.quantity;
      })
    );

    if (hasMissingStock) {
      setCheckoutError('Stock insuffisant pour finaliser cette commande.');
      return;
    }

    setCheckoutError(null);
    
    // 1. Enregistrer la commande
    addOrder(cart, totals.totalTTC, method, serviceMode, selectedCustomerId);
    
    // 2. Réduire les stocks
    cart.forEach(item => {
      reduceStock(item.product.recipe, item.quantity);
    });

    // 3. Mettre à jour la fidélité
    if (selectedCustomerId) {
      const redeemedItemsCount = cart.filter(i => i.isRedeemed).length;
      const pointsSpent = redeemedItemsCount * 100;
      const pointsEarned = Math.floor(totals.totalTTC);
      updateLoyaltyPoints(selectedCustomerId, pointsEarned - pointsSpent);
    }
    
    // 4. Impression
    setIsPrinting(true);
    setTimeout(() => {
      try {
        window.print();
      } catch {
        setCheckoutError("Impression indisponible: commande enregistree sans ticket imprime.");
      }
      setIsPrinting(false);
      setCart([]);
      setSelectedCustomerId(undefined);
    }, 500);
  };

  const addToCart = (product: Product, variant?: Variant) => {
    if (getProductStockStatus(product.recipe) === 'OUT_OF_STOCK') {
      setCheckoutError(`Produit indisponible: ${product.name}`);
      return;
    }

    if (product.variants && product.variants.length > 0 && !variant) {
      setVariantSelector(product);
      return;
    }

    const variantId = variant?.id || 'standard';
    const existing = cart.find(item => 
      item.productId === product.id && 
      !item.isRedeemed && 
      (item.selectedVariant?.id || 'standard') === variantId
    );

    const unitPrice = product.price + (variant?.priceExtra || 0);

    if (existing) {
      setCart(prev => prev.map(item => 
        (item.productId === product.id && !item.isRedeemed && (item.selectedVariant?.id || 'standard') === variantId) 
        ? {...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * unitPrice} 
        : item
      ));
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: unitPrice,
        totalPrice: unitPrice,
        selectedVariant: variant
      };
      setCart(prev => [...prev, newItem]);
    }
    setVariantSelector(null);
    setCheckoutError(null);
  };

  const redeemWithPoints = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !selectedCustomer || selectedCustomer.loyaltyPoints < 100) return;
    if (getProductStockStatus(product.recipe) === 'OUT_OF_STOCK') {
      setCheckoutError(`Impossible d'offrir ${product.name}: stock insuffisant.`);
      return;
    }

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      product,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      isRedeemed: true
    };
    setCart(prev => [...prev, newItem]);
    setCheckoutError(null);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#F1F3F6]">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveCategoryId('all')}
              className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all uppercase ${activeCategoryId === 'all' ? 'bg-[#b3247e] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all uppercase ${activeCategoryId === cat.id ? 'bg-[#b3247e] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {selectedCustomer ? (
              <div className="flex items-center gap-3 bg-pink-50 border border-[#b3247e]/20 px-4 py-2 rounded-2xl animate-in zoom-in-95">
                <div className="w-8 h-8 bg-[#b3247e] text-white rounded-xl flex items-center justify-center font-black text-xs">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-800 leading-none">{selectedCustomer.name}</p>
                  <p className="text-[9px] font-bold text-[#b3247e] uppercase mt-1">{selectedCustomer.loyaltyPoints} PTS</p>
                </div>
                <button onClick={() => setSelectedCustomerId(undefined)} className="ml-2 text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Rechercher client..." 
                  className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#b3247e] w-48 transition-all focus:w-64"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
                {searchTerm && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-60 overflow-y-auto">
                    {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                      <button 
                        key={c.id}
                        onClick={() => { setSelectedCustomerId(c.id); setSearchTerm(''); }}
                        className="w-full text-left p-3 hover:bg-pink-50 flex items-center gap-3 border-b last:border-none"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-xs">{c.name.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-black">{c.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{c.loyaltyPoints} pts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 content-start scrollbar-hide">
          {products.filter(p => activeCategoryId === 'all' || p.categoryId === activeCategoryId).map(product => {
            const stockStatus = getProductStockStatus(product.recipe);
            const isOutOfStock = stockStatus === 'OUT_OF_STOCK';
            const isCritical = stockStatus === 'CRITICAL';

            return (
              <div 
                key={product.id}
                className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all text-left overflow-hidden group relative ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
              >
                <button 
                  data-testid={`product-card-${product.id}`}
                  onClick={() => !isOutOfStock && addToCart(product)} 
                  disabled={isOutOfStock}
                  className={`w-full text-left transition-transform ${isOutOfStock ? 'cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-xl font-black text-sm shadow-xl text-[#54bb24]">
                      {formatPrix(product.price)}
                    </div>
                    {product.variants && product.variants.length > 0 && (
                      <div className="absolute top-4 right-4 bg-white/80 p-1.5 rounded-lg text-gray-500">
                        <Plus size={14} />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Épuisé</span>
                      </div>
                    )}
                    {isCritical && !isOutOfStock && (
                      <div className="absolute top-4 left-4 bg-orange-500 text-white p-1.5 rounded-lg shadow-lg animate-pulse">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-gray-800 leading-tight">{product.name}</h3>
                  </div>
                </button>
                
                {selectedCustomer && selectedCustomer.loyaltyPoints >= 100 && !isOutOfStock && (
                  <button 
                    onClick={() => redeemWithPoints(product.id)}
                    className="absolute top-4 left-4 bg-[#54bb24] text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-all group/gift"
                    title="Offrir avec 100 points"
                  >
                    <Gift size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl relative z-20">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setServiceMode('TAKEAWAY')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${serviceMode === 'TAKEAWAY' ? 'bg-white text-[#b3247e] shadow-sm' : 'text-gray-400'}`}>
              <Truck size={14} className="inline mr-2" /> Emporter
            </button>
            <button onClick={() => setServiceMode('DINE_IN')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${serviceMode === 'DINE_IN' ? 'bg-white text-[#54bb24] shadow-sm' : 'text-gray-400'}`}>
              <UtensilsCrossed size={14} className="inline mr-2" /> Sur Place
            </button>
          </div>
          {checkoutError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-black text-red-600">
              {checkoutError}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="font-black text-[10px] uppercase tracking-widest">Panier Vide</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex justify-between items-center animate-in slide-in-from-right-4 group">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-xl font-black text-xs hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  {item.quantity}
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{item.product.name}</span>
                    {item.selectedVariant && (
                      <span className="text-[10px] font-black text-[#b3247e] uppercase bg-pink-50 px-2 py-0.5 rounded">
                        {item.selectedVariant.name}
                      </span>
                    )}
                  </div>
                  {item.isRedeemed && <span className="text-[9px] font-black text-[#54bb24] uppercase">🎁 Offert (Points)</span>}
                </div>
              </div>
              <span className={`font-black text-sm ${item.isRedeemed ? 'text-[#54bb24]' : 'text-gray-800'}`}>
                {item.isRedeemed ? 'Gratuit' : formatPrix(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-200 rounded-t-[3rem] space-y-6 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)]">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              <span>TVA (Incluse)</span>
              <span>{formatPrix(totals.totalTVA)}</span>
            </div>
            <div className="flex justify-between items-end px-1">
              <span className="font-black text-gray-400 text-xs uppercase tracking-widest">Total</span>
              <span className="text-4xl font-black text-[#b3247e] tracking-tighter">{formatPrix(totals.totalTTC)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button data-testid="checkout-card" onClick={() => handleCheckout('CARD')} disabled={cart.length === 0} className="bg-[#b3247e] text-white p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-2 hover:bg-[#8a1a60] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-pink-100">
              <CreditCard size={24} /> Carte Bancaire
            </button>
            <button data-testid="checkout-cash" onClick={() => handleCheckout('CASH')} disabled={cart.length === 0} className="bg-[#54bb24] text-white p-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-2 hover:bg-[#449c1d] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-100">
              <Banknote size={24} /> Espèces
            </button>
          </div>
        </div>

        {isPrinting && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in z-50">
            <div className="w-16 h-16 border-4 border-[#b3247e] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[#b3247e] uppercase tracking-[0.2em] text-xs">Impression ticket...</p>
          </div>
        )}
      </div>

      {/* Modale Sélecteur de Variantes */}
      {variantSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Options</h2>
              <button onClick={() => setVariantSelector(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-gray-500 font-medium mb-8">Choisissez une option pour {variantSelector.name}</p>
            <div className="space-y-4">
              <button 
                onClick={() => addToCart(variantSelector)}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl flex justify-between items-center transition-all group"
              >
                <span className="font-black text-gray-800 uppercase text-xs tracking-widest">Standard</span>
                <span className="font-bold text-gray-400">Gratuit</span>
              </button>
              {variantSelector.variants?.map(variant => (
                <button 
                  key={variant.id}
                  onClick={() => addToCart(variantSelector, variant)}
                  className="w-full p-4 bg-pink-50/50 hover:bg-pink-100 rounded-2xl flex justify-between items-center transition-all border border-[#b3247e]/10 group"
                >
                  <span className="font-black text-[#b3247e] uppercase text-xs tracking-widest">{variant.name}</span>
                  <span className="font-black text-gray-800">+{formatPrix(variant.priceExtra)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zone d'impression masquée */}
      <div id="print-ticket" className="hidden print:block text-black">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold uppercase">Molly's Truck</h2>
          <p className="text-xs">Les meilleurs burgers de la ville !</p>
          <div className="border-b border-dashed border-black my-2"></div>
          <p className="text-[10px]">{new Date().toLocaleString('fr-FR')}</p>
          <p className="text-[10px]">Ticket #{Math.floor(Math.random() * 1000)}</p>
        </div>
        
        <div className="space-y-1 mb-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-xs">
              <span>{item.quantity}x {item.product.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}</span>
              <span>{formatPrix(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2 space-y-1">
          <div className="flex justify-between font-bold">
            <span>TOTAL TTC</span>
            <span>{formatPrix(totals.totalTTC)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Dont TVA</span>
            <span>{formatPrix(totals.totalTVA)}</span>
          </div>
        </div>

        <div className="text-center mt-6 text-[10px]">
          <p>Merci de votre visite !</p>
          <p>Suivez-nous sur Instagram @mollystruck</p>
        </div>
      </div>
    </div>
  );
};

export default POS;
