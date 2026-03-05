
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ingredient, Purchase, Waste, RecipeItem } from '../types';
import { INGREDIENTS } from '../constants';
import { getProductStockStatus as getStatusUtil } from '../utils';

interface InventoryContextType {
  ingredients: Ingredient[];
  wastes: Waste[];
  addIngredient: (ing: Omit<Ingredient, 'id'>) => void;
  addPurchase: (p: Omit<Purchase, 'id'>) => void;
  addWaste: (w: Omit<Waste, 'id'>) => void;
  reduceStock: (recipe: RecipeItem[], quantity: number) => void;
  getProductStockStatus: (recipe: RecipeItem[]) => 'AVAILABLE' | 'CRITICAL' | 'OUT_OF_STOCK';
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('molls_ingredients');
    return saved ? JSON.parse(saved) : INGREDIENTS;
  });

  const [wastes, setWastes] = useState<Waste[]>(() => {
    const saved = localStorage.getItem('molls_wastes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('molls_ingredients', JSON.stringify(ingredients));
    localStorage.setItem('molls_wastes', JSON.stringify(wastes));
  }, [ingredients, wastes]);

  const addIngredient = (ing: Omit<Ingredient, 'id'>) => {
    setIngredients(prev => [...prev, { ...ing, id: crypto.randomUUID() }]);
  };

  const addPurchase = (p: Omit<Purchase, 'id'>) => {
    if (!Number.isFinite(p.quantity) || p.quantity <= 0) return;
    if (!Number.isFinite(p.totalPrice) || p.totalPrice < 0) return;

    setIngredients(prev => prev.map(ing => {
      if (ing.id === p.ingredientId) {
        const totalQty = ing.currentStock + p.quantity;
        if (totalQty <= 0) return ing;
        const totalValue = (ing.currentStock * ing.costPrice) + p.totalPrice;
        return {
          ...ing,
          currentStock: Number(totalQty.toFixed(2)),
          costPrice: Number((totalValue / totalQty).toFixed(2))
        };
      }
      return ing;
    }));
  };

  const addWaste = (w: Omit<Waste, 'id'>) => {
    if (!Number.isFinite(w.quantity) || w.quantity <= 0) return;

    const newWaste = { ...w, id: crypto.randomUUID() };
    setWastes(prev => [...prev, newWaste]);
    setIngredients(prev => prev.map(ing => {
      if (ing.id === w.ingredientId) {
        return { ...ing, currentStock: Number(Math.max(0, ing.currentStock - w.quantity).toFixed(2)) };
      }
      return ing;
    }));
  };

  const reduceStock = (recipe: RecipeItem[], quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setIngredients(prev => {
      const next = [...prev];
      recipe.forEach(recipeItem => {
        const idx = next.findIndex(i => i.id === recipeItem.ingredientId);
        if (idx !== -1) {
          const deduction = recipeItem.quantity * quantity;
          next[idx] = { 
            ...next[idx], 
            currentStock: Number(Math.max(0, next[idx].currentStock - deduction).toFixed(2)) 
          };
        }
      });
      return next;
    });
  };

  const getProductStockStatus = (recipe: RecipeItem[]) => {
    return getStatusUtil(recipe, ingredients);
  };

  return (
    <InventoryContext.Provider value={{
      ingredients, wastes,
      addIngredient, addPurchase, addWaste, reduceStock,
      getProductStockStatus
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};
