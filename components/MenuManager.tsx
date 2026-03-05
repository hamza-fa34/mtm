
import React, { useState } from 'react';
import { Plus, Calculator, Target, X, Save, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { Product, RecipeItem } from '../types';
import { formatPrix, calculerCoutMatiere, formatPercent } from '../utils';

// Contexts
import { useInventory } from '../context/InventoryContext';
import { useProducts } from '../context/ProductContext';
import { ASSETS } from '../assets';

const MenuManager: React.FC = () => {
  const { ingredients } = useInventory();
  const { products, updateProducts } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    categoryId: '1',
    vatRate: 10,
    recipe: [],
    isAvailable: true,
    imageUrl: ASSETS.BURGERS.CLASSIC,
    variants: []
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = {
      ...editingProduct,
      id: editingProduct.id || crypto.randomUUID()
    } as Product;

    if (editingProduct.id) {
      updateProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      updateProducts([...products, newProduct]);
    }
    setShowModal(false);
    setSelectedProduct(newProduct);
  };

  const addIngredientToRecipe = () => {
    const recipe = [...(editingProduct.recipe || [])];
    recipe.push({ ingredientId: ingredients[0]?.id || '', quantity: 0 });
    setEditingProduct({ ...editingProduct, recipe });
  };

  const removeIngredientFromRecipe = (index: number) => {
    const recipe = [...(editingProduct.recipe || [])];
    recipe.splice(index, 1);
    setEditingProduct({ ...editingProduct, recipe });
  };

  const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const recipe = [...(editingProduct.recipe || [])];
    recipe[index] = { ...recipe[index], [field]: value };
    setEditingProduct({ ...editingProduct, recipe });
  };

  const currentCout = calculerCoutMatiere(editingProduct.recipe || [], ingredients);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full scrollbar-hide">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Menu & Recettes</h1>
          <p className="text-gray-500 font-medium">Configurez vos plats et analysez vos marges.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct({ name: '', price: 0, categoryId: '1', vatRate: 10, recipe: [], isAvailable: true, imageUrl: ASSETS.BURGERS.CLASSIC, variants: [] }); setShowModal(true); }}
          className="bg-[#b3247e] text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-pink-100 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Nouveau Produit
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(product => {
              const coutMatiere = calculerCoutMatiere(product.recipe, ingredients);
              const priceHT = product.price / (1 + product.vatRate/100);
              const foodCostRatio = (coutMatiere / priceHT) * 100;
              const isSelected = selectedProduct?.id === product.id;

              return (
                <button 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] transition-all border-2 text-left group ${
                    isSelected ? 'bg-white border-[#b3247e] shadow-xl' : 'bg-white border-transparent shadow-sm hover:border-gray-200'
                  }`}
                >
                  <img src={product.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt={product.name} referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h3 className="font-black text-gray-800 leading-tight">{product.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      Prix : {formatPrix(product.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${foodCostRatio > 35 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#54bb24]'}`}>
                      {formatPercent(foodCostRatio)} FC
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {selectedProduct ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 sticky top-8 animate-in slide-in-from-right-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#b3247e]">
                  <Calculator size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Analyse Marge</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedProduct.name}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-2 text-[#b3247e] mb-1">
                      <TrendingUp size={14} />
                      <p className="text-[9px] font-black uppercase">Coût Matière</p>
                    </div>
                    <p className="text-xl font-black text-gray-800">{formatPrix(calculerCoutMatiere(selectedProduct.recipe, ingredients))}</p>
                  </div>
                  <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                    <div className="flex items-center gap-2 text-[#54bb24] mb-1">
                      <DollarSign size={14} />
                      <p className="text-[9px] font-black uppercase">Marge Brute</p>
                    </div>
                    <p className="text-xl font-black text-gray-800">
                      {formatPrix(selectedProduct.price / (1 + selectedProduct.vatRate/100) - calculerCoutMatiere(selectedProduct.recipe, ingredients))}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Détail Recette</h4>
                  {selectedProduct.recipe.length > 0 ? selectedProduct.recipe.map((item, idx) => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    const itemCost = ing ? (ing.costPrice * item.quantity) : 0;
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700">{ing?.name}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{item.quantity} {ing?.unit}</span>
                        </div>
                        <span className="font-black text-gray-400">{formatPrix(itemCost)}</span>
                      </div>
                    );
                  }) : <p className="text-xs italic text-gray-400">Aucun ingrédient défini</p>}
                </div>

                <button 
                  onClick={() => { setEditingProduct(selectedProduct); setShowModal(true); }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Modifier le produit
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <Target size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-black text-xs uppercase tracking-widest">Sélectionnez un produit<br/>pour voir son analyse</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">{editingProduct.id ? 'Modifier Produit' : 'Nouveau Produit'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-[#b3247e] uppercase tracking-widest">Informations Générales</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du plat</label>
                      <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prix TTC (€)</label>
                        <input required type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TVA (%)</label>
                        <select value={editingProduct.vatRate} onChange={e => setEditingProduct({...editingProduct, vatRate: parseFloat(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-[#b3247e]">
                          <option value="5.5">5.5% (Réduit)</option>
                          <option value="10">10% (Restauration)</option>
                          <option value="20">20% (Boissons)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Image URL</label>
                      <input type="text" value={editingProduct.imageUrl} onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#b3247e] font-bold" />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black text-[#b3247e] uppercase tracking-widest">Variantes / Options</h3>
                        <button 
                          type="button" 
                          onClick={() => {
                            const variants = [...(editingProduct.variants || [])];
                            variants.push({ id: crypto.randomUUID(), name: '', priceExtra: 0 });
                            setEditingProduct({ ...editingProduct, variants });
                          }}
                          className="text-[10px] font-black text-gray-400 hover:text-[#b3247e] uppercase tracking-widest"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editingProduct.variants || []).map((variant, vIdx) => (
                          <div key={variant.id} className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              placeholder="Nom (ex: XL)" 
                              value={variant.name} 
                              onChange={e => {
                                const variants = [...(editingProduct.variants || [])];
                                variants[vIdx].name = e.target.value;
                                setEditingProduct({ ...editingProduct, variants });
                              }}
                              className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                            />
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="+ €" 
                              value={variant.priceExtra} 
                              onChange={e => {
                                const variants = [...(editingProduct.variants || [])];
                                variants[vIdx].priceExtra = parseFloat(e.target.value);
                                setEditingProduct({ ...editingProduct, variants });
                              }}
                              className="w-20 p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                const variants = [...(editingProduct.variants || [])];
                                variants.splice(vIdx, 1);
                                setEditingProduct({ ...editingProduct, variants });
                              }}
                              className="p-2 text-red-300 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-[#b3247e] uppercase tracking-widest">Recette (Ingrédients)</h3>
                    <div className="bg-gray-50 px-3 py-1 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Coût estimé : {formatPrix(currentCout)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(editingProduct.recipe || []).map((item, index) => (
                      <div key={index} className="flex gap-2 items-center animate-in slide-in-from-right-2">
                        <select 
                          value={item.ingredientId} 
                          onChange={e => updateRecipeItem(index, 'ingredientId', e.target.value)}
                          className="flex-1 p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                        >
                          {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                        </select>
                        <input 
                          type="number" 
                          step="0.001" 
                          placeholder="Qté"
                          value={item.quantity} 
                          onChange={e => updateRecipeItem(index, 'quantity', parseFloat(e.target.value))}
                          className="w-20 p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none"
                        />
                        <button type="button" onClick={() => removeIngredientFromRecipe(index)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addIngredientToRecipe} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-[#b3247e] hover:text-[#b3247e] transition-all">
                      + Ajouter ingrédient
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-gray-100 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 rounded-3xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 bg-[#54bb24] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-2 hover:bg-[#449c1d] transition-all">
                  <Save size={20} /> Sauvegarder Produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
