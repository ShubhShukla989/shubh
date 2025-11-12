'use client';

import DynamicLayout from '@/components/DynamicLayout';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Header */}
      <header>
        <DynamicLayout
          layoutName="Site Header"
          fallback={
            <div className="bg-white border-b border-gray-200">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="text-2xl font-bold text-gray-900">
                    My Website
                  </Link>
                  <Navigation menuAlias="main-menu" />
                </div>
              </div>
            </div>
          }
        />
      </header>

      {/* Dynamic Homepage Content */}
      <main>
        <DynamicLayout
          layoutName="Website Homepage"
          fallback={
            <div className="container mx-auto px-4 py-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Our Website
              </h1>
              <p className="text-gray-600">
                This page is dynamically rendered from the Page Designer.
              </p>
            </div>
          }
        />
      </main>

      {/* Dynamic Footer */}
      <footer>
        <DynamicLayout
          layoutName="Site Footer"
          fallback={
            <div className="bg-gray-900 text-white py-8 mt-12">
              <div className="container mx-auto px-4 text-center">
                <p>&copy; 2025 My Website. All rights reserved.</p>
              </div>
            </div>
          }
        />
      </footer>
    </div>
  );
}
