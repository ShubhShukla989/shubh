'use client';

import AnalyticsTracker from '@/components/AnalyticsTracker';

interface PageWrapperProps {
  children: React.ReactNode;
  headerCode?: string;
  footerCode?: string;
}

export default function PageWrapper({ children, headerCode, footerCode }: PageWrapperProps) {
  return (
    <>
      <AnalyticsTracker />
      
      {/* Header Code Injection */}
      {headerCode && (
        <div dangerouslySetInnerHTML={{ __html: headerCode }} />
      )}

      {/* Page Content */}
      {children}

      {/* Footer Code Injection */}
      {footerCode && (
        <div dangerouslySetInnerHTML={{ __html: footerCode }} />
      )}
    </>
  );
}
