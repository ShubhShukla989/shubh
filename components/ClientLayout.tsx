'use client';

import { SessionProvider } from 'next-auth/react';
import { GlobalHeaderFooter } from './GlobalHeaderFooter';
import QueryProvider from '@/providers/QueryProvider';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <GlobalHeaderFooter>{children}</GlobalHeaderFooter>
      </QueryProvider>
    </SessionProvider>
  );
}
