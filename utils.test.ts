import { describe, expect, it } from 'vitest';
import { CartItem, Ingredient, Product } from './types';
import {
  calculerCoutMatiere,
  calculerMarge,
  calculerTotaux,
  getProductStockStatus,
  prixHT,
} from './utils';

const product10: Product = {
  id: 'p1',
  categoryId: '1',
  name: 'Produit 10%',
  price: 11,
  vatRate: 10,
  recipe: [{ ingredientId: 'i1', quantity: 1 }],
  isAvailable: true,
};

const product20: Product = {
  id: 'p2',
  categoryId: '1',
  name: 'Produit 20%',
  price: 12,
  vatRate: 20,
  recipe: [{ ingredientId: 'i2', quantity: 2 }],
  isAvailable: true,
};

describe('utils - calculs metier critiques', () => {
  it('prixHT calcule correctement le HT depuis un TTC', () => {
    expect(prixHT(11, 10)).toBe(10);
    expect(prixHT(12, 20)).toBe(10);
  });

  it('calculerMarge retourne marge brute et pourcentage', () => {
    expect(calculerMarge(10, 4)).toEqual({ margeBrute: 6, margePercent: 60 });
    expect(calculerMarge(0, 3)).toEqual({ margeBrute: -3, margePercent: 0 });
  });

  it('calculerTotaux agrege correctement HT/TVA/TTC et detail par taux', () => {
    const items: CartItem[] = [
      {
        id: 'c1',
        productId: product10.id,
        product: product10,
        quantity: 1,
        unitPrice: 11,
        totalPrice: 11,
      },
      {
        id: 'c2',
        productId: product20.id,
        product: product20,
        quantity: 1,
        unitPrice: 12,
        totalPrice: 12,
      },
    ];

    const totals = calculerTotaux(items);

    expect(totals.totalHT).toBe(20);
    expect(totals.totalTVA).toBe(3);
    expect(totals.totalTTC).toBe(23);
    expect(totals.detailTVA['10']).toEqual({ baseHT: 10, montantTVA: 1 });
    expect(totals.detailTVA['20']).toEqual({ baseHT: 10, montantTVA: 2 });
  });

  it('calculerCoutMatiere ignore les ingredients manquants', () => {
    const ingredients: Ingredient[] = [
      {
        id: 'i1',
        name: 'Ingredient 1',
        unit: 'unit',
        currentStock: 10,
        minStock: 1,
        costPrice: 2.5,
        category: 'EPICERIE',
      },
      {
        id: 'i2',
        name: 'Ingredient 2',
        unit: 'kg',
        currentStock: 5,
        minStock: 1,
        costPrice: 3,
        category: 'PRODUITS_FRAIS',
      },
    ];

    const recette = [
      { ingredientId: 'i1', quantity: 2 },
      { ingredientId: 'i2', quantity: 1.5 },
      { ingredientId: 'missing', quantity: 10 },
    ];

    expect(calculerCoutMatiere(recette, ingredients)).toBe(9.5);
  });

  it('getProductStockStatus retourne OUT_OF_STOCK si un ingredient manque en quantite', () => {
    const ingredients: Ingredient[] = [
      {
        id: 'i1',
        name: 'Ingredient 1',
        unit: 'unit',
        currentStock: 0.5,
        minStock: 1,
        costPrice: 1,
        category: 'EPICERIE',
      },
    ];

    const status = getProductStockStatus([{ ingredientId: 'i1', quantity: 1 }], ingredients);
    expect(status).toBe('OUT_OF_STOCK');
  });

  it('getProductStockStatus retourne CRITICAL au seuil et AVAILABLE sinon', () => {
    const criticalIngredients: Ingredient[] = [
      {
        id: 'i1',
        name: 'Ingredient 1',
        unit: 'unit',
        currentStock: 2,
        minStock: 2,
        costPrice: 1,
        category: 'EPICERIE',
      },
    ];
    const availableIngredients: Ingredient[] = [
      {
        id: 'i1',
        name: 'Ingredient 1',
        unit: 'unit',
        currentStock: 5,
        minStock: 2,
        costPrice: 1,
        category: 'EPICERIE',
      },
    ];

    expect(getProductStockStatus([{ ingredientId: 'i1', quantity: 1 }], criticalIngredients)).toBe('CRITICAL');
    expect(getProductStockStatus([{ ingredientId: 'i1', quantity: 1 }], availableIngredients)).toBe('AVAILABLE');
  });
});
