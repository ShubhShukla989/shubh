'use client';

import { createContext, useContext, ReactNode } from 'react';

interface ClipContextType {
  clipImage: string | null;
  clipUrl: string;
  editionId: string;
  pageNumber: number;
}

const ClipContext = createContext<ClipContextType | undefined>(undefined);

export function ClipProvider({ 
  children, 
  clipImage,
  clipUrl,
  editionId,
  pageNumber
}: { 
  children: ReactNode;
  clipImage: string | null;
  clipUrl: string;
  editionId: string;
  pageNumber: number;
}) {
  return (
    <ClipContext.Provider
      value={{
        clipImage,
        clipUrl,
        editionId,
        pageNumber,
      }}
    >
      {children}
    </ClipContext.Provider>
  );
}

export function useClip() {
  const context = useContext(ClipContext);
  if (context === undefined) {
    throw new Error('useClip must be used within a ClipProvider');
  }
  return context;
}
