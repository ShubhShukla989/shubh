'use client';

import { SessionProvider } from 'next-auth/react';
import { GlobalHeaderFooter } from './GlobalHeaderFooter';
import { HeaderProvider } from '@/contexts/HeaderContext';
import QueryProvider from '@/providers/QueryProvider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <HeaderProvider>
          <GlobalHeaderFooter>{children}</GlobalHeaderFooter>
        </HeaderProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
