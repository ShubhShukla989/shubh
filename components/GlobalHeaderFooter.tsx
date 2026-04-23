'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useHeader } from '@/contexts/HeaderContext';
import { LayoutRenderer } from './layout-renderer/LayoutRenderer';

export function GlobalHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { headerLayout, footerLayout, isLoading, refreshLayouts } = useHeader();

  // Check if current page should have header/footer
  const shouldShowHeaderFooter = () => {
    // Don't show on admin pages (including all admin subpaths)
    if (pathname?.startsWith('/admin')) return false;
    // Don't show on login page
    if (pathname?.startsWith('/login')) return false;
    // Don't show on any admin-related paths
    if (pathname?.includes('/admin/')) return false;
    // Show on all other pages (including epaper category and archive pages)
    return true;
  };

  useEffect(() => {
    // Only refresh layouts on initial mount, not on every pathname change
    // This prevents unnecessary API calls when navigating between pages
    if (shouldShowHeaderFooter()) {
      // Check if layouts are already loaded
      if (!headerLayout && !footerLayout) {
        refreshLayouts();
      }
    }
  }, []); // Empty dependency array - only run once on mount

  // Don't show header/footer on admin pages
  if (!shouldShowHeaderFooter()) {
    return <>{children}</>;
  }

  // Always render header/footer using original layout system
  return (
    <>
      {/* Global Site Header */}
      {headerLayout && (
        <LayoutRenderer layoutName={headerLayout} />
      )}

      {/* Main Content */}
      {children}

      {/* Global Site Footer */}
      {footerLayout && (
        <LayoutRenderer layoutName={footerLayout} />
      )}
    </>
  );
}
