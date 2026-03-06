import React, { createContext, useContext, useEffect, useState } from 'react';
import { Category } from '../types';
import {
  getLocalCategories,
  loadCategories,
  saveCategories,
} from '../data/categoriesDataAdapter';

interface CategoryContextType {
  categories: Category[];
  updateCategories: (categories: Category[]) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => getLocalCategories());

  useEffect(() => {
    void saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    let mounted = true;
    void loadCategories().then((nextCategories) => {
      if (!mounted) return;
      setCategories(nextCategories);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, updateCategories: setCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within a CategoryProvider');
  return context;
};
