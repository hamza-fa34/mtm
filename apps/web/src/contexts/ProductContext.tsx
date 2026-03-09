
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import {
  getLocalProducts,
  loadProducts,
  saveProducts,
} from '../data/productsDataAdapter';

interface ProductContextType {
  products: Product[];
  updateProducts: (products: Product[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    return getLocalProducts();
  });
  const isHydratingRef = useRef(false);

  useEffect(() => {
    if (isHydratingRef.current) {
      isHydratingRef.current = false;
      return;
    }
    void saveProducts(products);
  }, [products]);

  useEffect(() => {
    let mounted = true;
    void loadProducts().then((nextProducts) => {
      if (!mounted) return;
      isHydratingRef.current = true;
      setProducts(nextProducts);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ProductContext.Provider value={{ products, updateProducts: setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};
