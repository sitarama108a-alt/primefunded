
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getPerformance, trace } from 'firebase/performance';
import { useFirebaseApp } from '@/firebase';
import { logError } from '@/lib/monitoring';

/**
 * PerformanceTracker monitors page load times and logs metrics to Firebase Performance.
 * It also handles reporting slow loads (> 3s) for administrative review.
 */
export function PerformanceTracker() {
  const pathname = usePathname();
  const app = useFirebaseApp();

  useEffect(() => {
    // Only initialize on the client side
    if (typeof window === 'undefined') return;

    try {
      const perf = getPerformance(app);
      const pageTrace = trace(perf, 'page_load_trace');
      pageTrace.start();

      // FIX: Ensure we pass a short string like 'pathname' instead of a CSS class string.
      // Firebase Performance attribute values have a strict 100-character limit.
      // We truncate the value as a safety measure to prevent "invalid attribute value" errors.
      const safePath = pathname.length > 100 ? pathname.substring(0, 100) : pathname;
      pageTrace.putAttribute('page_path', safePath);

      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const loadTime = (endTime - startTime) / 1000;

        // Stop the Firebase Performance trace
        pageTrace.stop();

        // Custom alert for significantly slow page loads
        if (loadTime > 3) {
          logError(
            `Slow page load detected: ${pathname} took ${loadTime.toFixed(2)} seconds`,
            'low'
          );
        }
      };
    } catch (error) {
      // Performance monitoring should fail silently to not interrupt the user experience
      console.warn('[PerformanceTracker] Initialization failed:', error);
    }
  }, [pathname, app]);

  return null;
}
