'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';

// Lazy load admin components
const Sidebar = dynamic(() => import('@/components/admin/Sidebar'), {
  loading: () => <div className="w-64 bg-gray-100 animate-pulse h-full"></div>,
});

const Topbar = dynamic(() => import('@/components/admin/Topbar'), {
  loading: () => <div className="h-16 bg-white border-b animate-pulse"></div>,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Set admin panel title
    document.title = 'ePaper CMS - Admin Panel';
  }, []);

  useEffect(() => {
    // Prevent body scroll when sidebar is open on mobile
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Always visible on desktop */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse h-full"></div>}>
            <Sidebar />
          </Suspense>
        </div>
        
        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse h-full"></div>}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </Suspense>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          <Suspense fallback={<div className="h-16 bg-white border-b animate-pulse"></div>}>
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
          </Suspense>
          <main className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
            <Suspense fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
