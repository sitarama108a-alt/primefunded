'use client';

/**
 * PerformanceTracker is now a no-op component to disable monitoring.
 * This resolves issues with invalid attribute values from automatic instrumentation.
 */
export function PerformanceTracker() {
  return null;
}
