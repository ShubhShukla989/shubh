'use client';

import { createContext, useContext, ReactNode } from 'react';

interface CategoryContextType {
  categoryId: number | null;
  categoryAlias: string | null;
  categoryTitle: string | null;
}

const CategoryContext = createContext<CategoryContextType>({
  categoryId: null,
  categoryAlias: null,
  categoryTitle: null,
});

export function CategoryProvider({
  children,
  categoryId,
  categoryAlias,
  categoryTitle,
}: {
  children: ReactNode;
  categoryId: number | null;
  categoryAlias: string | null;
  categoryTitle: string | null;
}) {
  return (
    <CategoryContext.Provider value={{ categoryId, categoryAlias, categoryTitle }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  return useContext(CategoryContext);
}
