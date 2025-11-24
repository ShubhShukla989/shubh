'use client';

import PublicHeader from '@/components/epaper/PublicHeader';

interface PageWrapperProps {
  children: React.ReactNode;
  headerCode?: string;
  footerCode?: string;
}

export default function PageWrapper({ children, headerCode, footerCode }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header Code Injection */}
      {headerCode && (
        <div dangerouslySetInnerHTML={{ __html: headerCode }} />
      )}

      {/* Container with max width and centered - Same as homepage */}
      <div className="max-w-[1100px] mx-auto w-full bg-white shadow-lg">
        {/* Public Header */}
        <PublicHeader />

        {/* Page Content */}
        {children}

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12">
          <div className="px-4 py-8">
            <div className="text-center">
              <p>&copy; {new Date().getFullYear()} Do Boje Dopahar. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Footer Code Injection */}
        {footerCode && (
          <div dangerouslySetInnerHTML={{ __html: footerCode }} />
        )}
      </div>
    </div>
  );
}
