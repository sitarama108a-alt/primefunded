
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logError } from '@/lib/monitoring';

export function PerformanceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = (endTime - startTime) / 1000;

      if (loadTime > 3) {
        logError(
          `Slow page load detected: ${pathname} took ${loadTime.toFixed(2)} seconds`,
          'low'
        );
      }
    };
  }, [pathname]);

  return null;
}
