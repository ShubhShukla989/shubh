import type { Metadata, Viewport } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { ClientLayout } from '@/components/ClientLayout';
import { ToastContainer } from '@/components/ui/ToastContainer';
import AnalyticsTracker from '@/components/AnalyticsTracker';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Epaper';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const defaultOg = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE;

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Comprehensive ePaper Content Management System',
  // metadataBase is critical — without this, relative OG image URLs silently break in production
  metadataBase: new URL(siteUrl),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  },
  applicationName: siteName,
  formatDetection: { telephone: false },
  openGraph: {
    siteName,
    images: defaultOg ? [defaultOg] : [],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
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
        <meta name="application-name" content="DBD NEWSPAPER" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Epaper CMS" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/icons/icon.png" />
        <link rel="shortcut icon" href="/icons/icon.png" />
      </head>
      <body 
        className="font-sans"
        suppressHydrationWarning={true}
        data-new-gr-c-s-check-loaded=""
        data-gr-ext-installed=""
      >
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
