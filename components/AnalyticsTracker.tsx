'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsTrackerProps {
  editionId?: number;
  pageNumber?: number;
}

export default function AnalyticsTracker({ editionId, pageNumber }: AnalyticsTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }

    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_url: pathname,
            edition_id: editionId,
            page_number: pageNumber,
            session_id: sessionId,
          }),
        });
      } catch (error) {
        console.error('Analytics tracking failed:', error);
      }
    };

    // Track immediately
    trackPageView();

    // Track view duration on page unload
    const startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const viewDuration = Math.floor((Date.now() - startTime) / 1000);
      
      // Use sendBeacon for reliable tracking on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          page_url: pathname,
          edition_id: editionId,
          page_number: pageNumber,
          session_id: sessionId,
          view_duration: viewDuration,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, editionId, pageNumber]);

  // Update session activity every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const sessionId = sessionStorage.getItem('analytics_session');
      if (sessionId) {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              page_url: pathname,
              session_id: sessionId,
            }),
          });
        } catch (error) {
          // Silently fail - don't spam console
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [pathname]);

  return null; // This component doesn't render anything
}