'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,  // We'll use custom spinner
  speed: 200,
  minimum: 0.08,
  trickleSpeed: 200,
});

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Start loading
    setLoading(true);
    NProgress.start();

    // Show spinner only if loading takes > 120ms (avoid flicker)
    const spinnerTimer = setTimeout(() => {
      if (loading) {
        setShowSpinner(true);
      }
    }, 120);

    // Simulate route change complete
    const completeTimer = setTimeout(() => {
      NProgress.done();
      setLoading(false);
      setShowSpinner(false);
    }, 100);

    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(completeTimer);
      NProgress.done();
      setLoading(false);
      setShowSpinner(false);
    };
  }, [pathname]);

  return (
    <>
      {/* Global Spinner Overlay */}
      {showSpinner && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm transition-opacity duration-150"
          style={{ 
            animation: 'fadeIn 150ms ease-in',
          }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Spinner */}
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '0.8s' }}
              ></div>
            </div>
            {/* Optional text */}
            <p className="text-sm text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* NProgress custom styles */
        #nprogress {
          pointer-events: none;
        }

        #nprogress .bar {
          background: #3b82f6;
          position: fixed;
          z-index: 99999;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }

        #nprogress .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px #3b82f6, 0 0 5px #3b82f6;
          opacity: 1.0;
          transform: rotate(3deg) translate(0px, -4px);
        }
      `}</style>
    </>
  );
}
