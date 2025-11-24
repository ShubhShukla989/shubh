'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutRenderer } from './layout-renderer/LayoutRenderer';

export function GlobalHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [headerLayout, setHeaderLayout] = useState<string | null>(null);
  const [footerLayout, setFooterLayout] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if current page should have header/footer
  const shouldShowHeaderFooter = () => {
    // Don't show on admin pages
    if (pathname?.startsWith('/admin')) return false;
    // Don't show on login page
    if (pathname?.startsWith('/login')) return false;
    // Show on all other pages (including epaper category and archive pages)
    return true;
  };

  useEffect(() => {
    if (shouldShowHeaderFooter()) {
      loadGlobalLayouts();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const loadGlobalLayouts = async () => {
    try {
      const response = await fetch('/api/settings/site');
      const data = await response.json();
      
      if (data.success) {
        // Use layout names from database, or fallback to hardcoded names
        setHeaderLayout(data.data?.site_header_layout || 'Site Header');
        setFooterLayout(data.data?.site_footer_layout || 'Site Footer');
      } else {
        // Fallback to hardcoded layout names
        setHeaderLayout('Site Header');
        setFooterLayout('Site Footer');
      }
    } catch (error) {
      console.error('Failed to load global layouts:', error);
      // Fallback to hardcoded layout names
      setHeaderLayout('Site Header');
      setFooterLayout('Site Footer');
    } finally {
      setLoading(false);
    }
  };

  // Don't show header/footer on admin pages
  if (!shouldShowHeaderFooter()) {
    return <>{children}</>;
  }

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Global Site Header */}
      {headerLayout && (
        <header className="site-header w-full">
          <LayoutRenderer layoutName={headerLayout} />
        </header>
      )}

      {/* Main Content */}
      <main className="site-content w-full">
        {children}
      </main>

      {/* Global Site Footer */}
      {footerLayout && (
        <footer className="site-footer w-full">
          <LayoutRenderer layoutName={footerLayout} />
        </footer>
      )}
    </>
  );
}
