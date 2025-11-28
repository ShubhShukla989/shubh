'use client';

import { GlobalHeaderFooter } from './GlobalHeaderFooter';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <GlobalHeaderFooter>{children}</GlobalHeaderFooter>;
}
