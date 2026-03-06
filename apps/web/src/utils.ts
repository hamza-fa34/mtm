
import { CartItem, CalculTotaux, RecipeItem, Ingredient } from './types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APP_STORAGE_KEYS, AUTO_BACKUPS_STORAGE_KEY } from './constants';

/**
 * Calcul du prix HT depuis le prix TTC
 */
export function prixHT(prixTTC: number, tauxTVA: number): number {
  return Number((prixTTC / (1 + tauxTVA / 100)).toFixed(2));
}

/**
 * Calcul de la marge d'un produit
 */
export function calculerMarge(prixVenteHT: number, coutMatiere: number) {
  const margeBrute = prixVenteHT - coutMatiere;
  const margePercent = prixVenteHT > 0 ? (margeBrute / prixVenteHT) * 100 : 0;
  
  return {
    margeBrute: Number(margeBrute.toFixed(2)),
    margePercent: Number(margePercent.toFixed(2)),
  };
}

/**
 * Calcul des totaux d'une commande avec détail TVA
 */
export function calculerTotaux(items: CartItem[]): CalculTotaux {
  const detailTVA: CalculTotaux['detailTVA'] = {};
  let totalHT = 0;
  let totalTVA = 0;
  
  items.forEach(item => {
    const prixTTC = item.totalPrice;
    const tauxTVA = item.product.vatRate;
    const pHT = prixTTC / (1 + tauxTVA / 100);
    const tva = prixTTC - pHT;
    
    totalHT += pHT;
    totalTVA += tva;
    
    const key = tauxTVA.toString();
    if (!detailTVA[key]) {
      detailTVA[key] = { baseHT: 0, montantTVA: 0 };
    }
    detailTVA[key].baseHT += pHT;
    detailTVA[key].montantTVA += tva;
  });
  
  // Arrondir
  Object.keys(detailTVA).forEach(key => {
    detailTVA[key].baseHT = Number(detailTVA[key].baseHT.toFixed(2));
    detailTVA[key].montantTVA = Number(detailTVA[key].montantTVA.toFixed(2));
  });
  
  return {
    totalHT: Number(totalHT.toFixed(2)),
    totalTVA: Number(totalTVA.toFixed(2)),
    totalTTC: Number((totalHT + totalTVA).toFixed(2)),
    detailTVA,
  };
}

/**
 * Calcul du coût matière d'un produit depuis sa recette
 */
export function calculerCoutMatiere(
  recette: RecipeItem[],
  ingredients: Ingredient[]
): number {
  const cout = recette.reduce((total, item) => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    if (!ingredient) return total;
    return total + (ingredient.costPrice * item.quantity);
  }, 0);
  
  return Number(cout.toFixed(2));
}

/**
 * Formate un prix en euros
 */
export function formatPrix(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant);
}

/**
 * Formate une date
 */
export function formatDate(date: string | Date | number, formatStr: string = 'PPP'): string {
  let dateObj: Date;
  if (typeof date === 'string') dateObj = parseISO(date);
  else if (typeof date === 'number') dateObj = new Date(date);
  else dateObj = date;
  
  return format(dateObj, formatStr, { locale: fr });
}

/**
 * Formate un pourcentage
 */
export function formatPercent(valeur: number, decimales: number = 1): string {
  return `${valeur.toFixed(decimales)}%`;
}

/**
 * Export CSV
 */
export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(';');
  const rows = data.map(obj => Object.values(obj).join(';')).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export JSON file.
 */
export function downloadJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface GlobalBackupPayload {
  schemaVersion: string;
  generatedAt: string;
  app: string;
  reason: string;
  keys: Record<string, unknown>;
}

export interface AutoBackupEntry extends GlobalBackupPayload {
  id: string;
}

export function buildGlobalBackupPayload(options?: {
  reason?: string;
  overrides?: Record<string, unknown>;
}): GlobalBackupPayload {
  const keys: Record<string, unknown> = {};

  APP_STORAGE_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    try {
      keys[key] = JSON.parse(raw);
    } catch {
      keys[key] = raw;
    }
  });

  if (options?.overrides) {
    Object.entries(options.overrides).forEach(([key, value]) => {
      keys[key] = value;
    });
  }

  return {
    schemaVersion: 'v1-standalone',
    generatedAt: new Date().toISOString(),
    app: "Molly's Truck Manager",
    reason: options?.reason ?? 'manual',
    keys,
  };
}

export function saveAutoBackup(payload: GlobalBackupPayload, maxEntries: number = 20): number {
  const raw = localStorage.getItem(AUTO_BACKUPS_STORAGE_KEY);
  let history: AutoBackupEntry[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        history = parsed;
      }
    } catch {
      history = [];
    }
  }

  history.unshift({
    ...payload,
    id: crypto.randomUUID(),
  });

  const trimmed = history.slice(0, maxEntries);
  localStorage.setItem(AUTO_BACKUPS_STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed.length;
}

export function getAutoBackups(): AutoBackupEntry[] {
  const raw = localStorage.getItem(AUTO_BACKUPS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is AutoBackupEntry => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        typeof entry.generatedAt === 'string' &&
        typeof entry.schemaVersion === 'string' &&
        typeof entry.reason === 'string' &&
        typeof entry.keys === 'object'
      );
    });
  } catch {
    return [];
  }
}

/**
 * Vérifie l'état du stock pour un produit basé sur sa recette
 */
export function getProductStockStatus(recipe: RecipeItem[], ingredients: Ingredient[]): 'AVAILABLE' | 'CRITICAL' | 'OUT_OF_STOCK' {
  if (!recipe || recipe.length === 0) return 'AVAILABLE';
  
  let status: 'AVAILABLE' | 'CRITICAL' | 'OUT_OF_STOCK' = 'AVAILABLE';
  
  for (const item of recipe) {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    if (!ingredient) continue;
    
    if (ingredient.currentStock < item.quantity) {
      return 'OUT_OF_STOCK';
    }
    
    if (ingredient.currentStock <= ingredient.minStock) {
      status = 'CRITICAL';
    }
  }
  
  return status;
}
