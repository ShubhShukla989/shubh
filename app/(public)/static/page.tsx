'use client';

import DynamicLayout from '@/components/DynamicLayout';
import Link from 'next/link';

export default function StaticPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Header */}
      <header>
        <DynamicLayout layoutName="Site Header" />
      </header>

      {/* Dynamic Static Page Content */}
      <main className="container mx-auto px-4 py-12">
        <DynamicLayout
          layoutName="Static Page"
          fallback={
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Static Page
              </h1>
              <div className="prose max-w-none">
                <p>This is a static page with dynamic layout.</p>
              </div>
            </div>
          }
        />
      </main>

      {/* Dynamic Footer */}
      <footer>
        <DynamicLayout layoutName="Site Footer" />
      </footer>
    </div>
  );
}
