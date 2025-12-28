import type { Metadata, Viewport } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { ClientLayout } from '@/components/ClientLayout';
import { ToastContainer } from '@/components/ui/ToastContainer';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  title: 'Epaper CMS',
  description: 'Comprehensive ePaper Content Management System',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Epaper CMS',
  },
  applicationName: 'Epaper CMS',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
        />
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          rel="stylesheet" 
        />
        
        {/* Basic meta tags */}
        <meta name="application-name" content="Epaper CMS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Epaper CMS" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon.svg" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="shortcut icon" href="/icons/icon.svg" />
      </head>
      <body className="font-sans">
        <GoogleAnalytics />
        <AnalyticsTracker />
        <ClientLayout>
          {children}
        </ClientLayout>
        <ToastContainer />
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        ></script>
      </body>
    </html>
  );
}
