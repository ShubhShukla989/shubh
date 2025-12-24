'use client';

import { SessionProvider } from 'next-auth/react';
import { GlobalHeaderFooter } from './GlobalHeaderFooter';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalHeaderFooter>{children}</GlobalHeaderFooter>
    </SessionProvider>
  );
}
