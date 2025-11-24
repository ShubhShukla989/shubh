'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function GoogleAnalytics() {
  const [measurementId, setMeasurementId] = useState<string>('');

  useEffect(() => {
    // Fetch Google Analytics measurement ID from settings
    fetch('/api/settings/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.measurement_id) {
          setMeasurementId(data.data.measurement_id);
        }
      })
      .catch((error) => {
        console.error('Failed to load analytics settings:', error);
      });
  }, []);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
