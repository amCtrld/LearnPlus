/**
 * Web Vitals Reporter Component
 * 
 * Captures and reports Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { performanceMonitor, type WebVitalsMetric } from '@/lib/performance';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Convert Next.js metric format to our format
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name as any,
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
      id: metric.id,
    };

    performanceMonitor.recordWebVital(webVitalMetric);
  });

  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      console.log('[Performance] Web Vitals reporting initialized');
    }
  }, []);

  return null; // This component doesn't render anything
}
