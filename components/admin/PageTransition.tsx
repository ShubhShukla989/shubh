'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple fade-in on route change
    if (containerRef.current) {
      containerRef.current.style.opacity = '0';
      
      // Use requestAnimationFrame for smooth animation
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      });
    }
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      style={{
        opacity: 1,
        transition: 'opacity 0.15s ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
