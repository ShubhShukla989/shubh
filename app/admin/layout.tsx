'use client';

import { useState, Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import { PageTransition } from '@/components/admin';
import NavigationLoader from '@/components/admin/NavigationLoader';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { useNavigationMetrics } from '@/hooks/useNavigationMetrics';

// Simple skeleton loader
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Elite: Predictive prefetching for likely next routes
  usePredictivePrefetch();

  // Elite: Performance monitoring (dev only)
  useNavigationMetrics();

  return (
    <AuthProvider>
      {/* Elite: Navigation loader with top bar + spinner */}
      <NavigationLoader />
      
      <div className="flex min-h-screen bg-white">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 p-4 lg:p-6 bg-white overflow-auto">
            <Suspense fallback={<Skeleton />}>
              <PageTransition>
                {children}
              </PageTransition>
            </Suspense>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
