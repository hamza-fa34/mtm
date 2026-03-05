
export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

export interface Category {
  id: string;
  name: string;
  color: string;
  ordre: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'unit' | 'unité';
  currentStock: number;
  minStock: number;
  costPrice: number;
  category: string;
}

export interface Purchase {
  id: string;
  ingredientId: string;
  supplierName: string;
  date: number;
  quantity: number;
  totalPrice: number;
}

export interface Waste {
  id: string;
  ingredientId: string;
  quantity: number;
  reason: 'Péremption' | 'Casse' | 'Erreur' | 'Autre';
  date: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

// Added Variant interface for products
export interface Variant {
  id: string;
  name: string;
  priceExtra: number;
}

// Added Supplier interface
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  vatRate: number;
  recipe: RecipeItem[];
  imageUrl?: string;
  isAvailable: boolean;
  loyaltyPrice?: number; // Prix en points pour l'offrir
  variants?: Variant[]; // Added variants property to resolve type error in constants.tsx
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type ServiceMode = 'TAKEAWAY' | 'DINE_IN';
export type PaymentMethod = 'CASH' | 'CARD' | 'TR';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isRedeemed?: boolean; // Si l'article est offert via points
  selectedVariant?: Variant; // Option choisie (ex: Taille XL, sans oignons)
}

export interface Order {
  id: string;
  orderNumber: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  serviceMode: ServiceMode;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  lastVisit?: number;
}

export interface CalculTotaux {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  detailTVA: {
    [key: string]: {
      baseHT: number;
      montantTVA: number;
    };
  };
}

export interface Expense {
  id: string;
  label: string;
  merchant: string;
  amountTTC: number;
  vatAmount: number;
  category: string;
  paymentMethod: 'Caisse (Espèces)' | 'Carte Pro' | 'Perso' | 'Virement';
  date: number;
  hasReceipt: boolean;
}

export type UserRole = 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
}

export interface DailySession {
  id: string;
  startTime: number;
  endTime?: number;
  initialCash: number;
  finalCash?: number;
  totalSales: number;
  totalExpenses: number;
  ordersCount: number;
  status: 'OPEN' | 'CLOSED';
  salesByMethod: {
    [key: string]: number;
  };
  vatSummary: {
    [rate: string]: {
      baseHT: number;
      amountTVA: number;
    };
  };
}
