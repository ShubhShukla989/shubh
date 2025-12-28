'use client';

import { useEffect, useState, Suspense, Component, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';

// Simple Error Boundary component
class SimpleErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Error fallback component
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the admin panel. Please try refreshing the page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lazy load admin components with better error handling
const Sidebar = dynamic(() => import('@/components/admin/Sidebar').catch(() => ({ 
  default: () => <div className="w-64 bg-red-50 p-4 text-red-600">Sidebar failed to load</div> 
})), {
  loading: () => <div className="w-64 bg-gray-100 animate-pulse h-full"></div>,
});

const Topbar = dynamic(() => import('@/components/admin/Topbar').catch(() => ({ 
  default: () => <div className="h-16 bg-red-50 p-4 text-red-600">Topbar failed to load</div> 
})), {
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
    <SimpleErrorBoundary fallback={<ErrorFallback />}>
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
              <SimpleErrorBoundary fallback={<div className="w-64 bg-red-50 p-4 text-red-600">Sidebar error</div>}>
                <Sidebar />
              </SimpleErrorBoundary>
            </Suspense>
          </div>
          
          {/* Mobile Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse h-full"></div>}>
              <SimpleErrorBoundary fallback={<div className="w-64 bg-red-50 p-4 text-red-600">Sidebar error</div>}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </SimpleErrorBoundary>
            </Suspense>
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col lg:ml-64">
            <Suspense fallback={<div className="h-16 bg-white border-b animate-pulse"></div>}>
              <SimpleErrorBoundary fallback={<div className="h-16 bg-red-50 p-4 text-red-600">Topbar error</div>}>
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
              </SimpleErrorBoundary>
            </Suspense>
            <main className="flex-1 p-4 lg:p-6 bg-gray-50 overflow-auto">
              <Suspense fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              }>
                <SimpleErrorBoundary fallback={
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Page Error</h3>
                    <p className="text-red-600 mb-4">This page failed to load properly.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Refresh Page
                    </button>
                  </div>
                }>
                  {children}
                </SimpleErrorBoundary>
              </Suspense>
            </main>
          </div>
        </div>
      </AuthProvider>
    </SimpleErrorBoundary>
  );
}
