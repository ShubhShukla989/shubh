'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsTrackerProps {
  editionId?: number;
  pageNumber?: number;
}

export default function AnalyticsTracker({ editionId, pageNumber }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Skip tracking for admin routes
    if (pathname.startsWith('/admin')) {
      return;
    }

    // Skip if already tracked for this page
    if (hasTracked.current) {
      return;
    }

    // Generate or get persistent user ID (survives browser restarts)
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_user_id', userId);
    }

    // Generate session ID (resets on browser close)
    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }

    // Track unique page view
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
            user_id: userId,
            session_id: sessionId,
          }),
        });
        hasTracked.current = true;
      } catch (error) {
        // Silent fail
      }
    };

    trackPageView();

    // Reset tracking flag when pathname changes
    return () => {
      hasTracked.current = false;
    };
  }, [pathname, editionId, pageNumber]);

  // Update session activity (less frequent)
  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      return;
    }

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
              session_id: sessionId,
              activity_update: true,
            }),
          });
        } catch (error) {
          // Silent fail
        }
      }
    }, 60000); // 1 minute instead of 30 seconds

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}