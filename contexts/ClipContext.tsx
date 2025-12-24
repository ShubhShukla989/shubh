'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface ClipContextType {
  clipImage: string | null;
  clipUrl: string;
  editionId: string;
  pageNumber: number;
  combinedImage: string | null;
  setCombinedImage: (image: string | null) => void;
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
  const [combinedImage, setCombinedImage] = useState<string | null>(null);

  return (
    <ClipContext.Provider
      value={{
        clipImage,
        clipUrl,
        editionId,
        pageNumber,
        combinedImage,
        setCombinedImage,
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
