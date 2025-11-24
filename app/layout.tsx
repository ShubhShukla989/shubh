import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import '../styles/mobile.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { GlobalHeaderFooter } from '@/components/GlobalHeaderFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Epaper',
  description: 'Comprehensive ePaper Content Management System',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleAnalytics />
        <GlobalHeaderFooter>
          {children}
        </GlobalHeaderFooter>
      </body>
    </html>
  );
}
