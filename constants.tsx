
import { Category, Product, Ingredient, Customer, Order, Supplier } from './types';
import { ASSETS } from './assets';

export const APP_STORAGE_KEYS = [
  'molls_settings',
  'molls_users',
  'molls_products',
  'molls_ingredients',
  'molls_wastes',
  'molls_customers',
  'molls_orders',
  'molls_current_session',
  'molls_sessions_history',
  'molls_expenses',
] as const;

export const AUTO_BACKUPS_STORAGE_KEY = 'molls_auto_backups';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Burgers', color: 'bg-orange-500', ordre: 1 },
  { id: '2', name: 'Snacks', color: 'bg-yellow-500', ordre: 2 },
  { id: '3', name: 'Boissons', color: 'bg-blue-500', ordre: 3 },
  { id: '4', name: 'Desserts', color: 'bg-pink-500', ordre: 4 },
];

export const INGREDIENTS: Ingredient[] = [
  { id: 'ing1', name: 'Steak haché', unit: 'kg', currentStock: 8, minStock: 5, costPrice: 12, category: 'PRODUITS_FRAIS' },
  { id: 'ing2', name: 'Pain burger', unit: 'unité', currentStock: 50, minStock: 20, costPrice: 0.5, category: 'EPICERIE' },
  { id: 'ing3', name: 'Salade', unit: 'kg', currentStock: 2, minStock: 1, costPrice: 3, category: 'PRODUITS_FRAIS' },
  { id: 'ing4', name: 'Tomate', unit: 'kg', currentStock: 3, minStock: 2, costPrice: 4, category: 'PRODUITS_FRAIS' },
  { id: 'ing5', name: 'Fromage', unit: 'kg', currentStock: 3, minStock: 2, costPrice: 15, category: 'PRODUITS_FRAIS' },
  { id: 'ing6', name: 'Cola 33cl', unit: 'unité', currentStock: 24, minStock: 12, costPrice: 0.6, category: 'BOISSONS' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Burger Classic',
    categoryId: '1',
    price: 12,
    vatRate: 10,
    isAvailable: true,
    imageUrl: ASSETS.BURGERS.CLASSIC,
    variants: [
      { id: 'var1', name: 'Taille XL', priceExtra: 3 },
      { id: 'var2', name: 'Sans oignon', priceExtra: 0 },
    ],
    recipe: [
      { ingredientId: 'ing1', quantity: 0.15 },
      { ingredientId: 'ing2', quantity: 1 },
      { ingredientId: 'ing3', quantity: 0.02 },
      { ingredientId: 'ing4', quantity: 0.03 },
      { ingredientId: 'ing5', quantity: 0.03 },
    ],
  },
  {
    id: 'prod2',
    name: 'Burger Fromager',
    categoryId: '1',
    price: 14,
    vatRate: 10,
    isAvailable: true,
    imageUrl: ASSETS.BURGERS.CHEESE,
    recipe: [
      { ingredientId: 'ing1', quantity: 0.15 },
      { ingredientId: 'ing2', quantity: 1 },
      { ingredientId: 'ing5', quantity: 0.08 },
    ],
  },
  {
    id: 'prod3',
    name: 'Frites Maison',
    categoryId: '2',
    price: 4.5,
    vatRate: 10,
    isAvailable: true,
    imageUrl: ASSETS.SIDES.FRIES,
    recipe: [],
  },
  {
    id: 'prod4',
    name: 'Cola',
    categoryId: '3',
    price: 3.5,
    vatRate: 20,
    isAvailable: true,
    imageUrl: ASSETS.DRINKS.COLA,
    recipe: [{ ingredientId: 'ing6', quantity: 1 }],
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Jean Dupont', phone: '0612345678', loyaltyPoints: 120, lastVisit: Date.now() - 86400000 },
  { id: 'c2', name: 'Marie Lecoq', phone: '0687654321', loyaltyPoints: 45, lastVisit: Date.now() - 172800000 },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'four1',
    name: 'Metro Cash & Carry',
    contact: 'Service commercial',
    phone: '01 23 45 67 89',
    email: 'contact@metro.fr',
  },
];

export const MOCK_ORDERS: Order[] = [];
