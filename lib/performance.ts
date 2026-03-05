/**
 * Performance Monitoring Utility
 * 
 * Tracks Web Vitals and API performance metrics
 * Helps identify bottlenecks and optimize user experience
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server response time
 * - API response times
 */

/**
 * Web Vitals metrics
 */
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * API performance metrics
 */
export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  cached?: boolean;
}

/**
 * Performance metrics store
 */
class PerformanceMonitor {
  private webVitals: WebVitalsMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Record a Web Vitals metric
   */
  recordWebVital(metric: WebVitalsMetric): void {
    this.webVitals.push(metric);
    
    // Keep only recent metrics
    if (this.webVitals.length > this.maxMetrics) {
      this.webVitals.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
      });
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('web-vital', metric);
    }
  }

  /**
   * Record an API call metric
   */
  recordAPICall(metric: APIMetric): void {
    this.apiMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift();
    }

    // Log slow API calls
    if (metric.duration > 1000) {
      console.warn(`[Performance] Slow API call: ${metric.endpoint} took ${metric.duration}ms`);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] API ${metric.method} ${metric.endpoint}:`, {
        duration: `${metric.duration}ms`,
        status: metric.status,
        cached: metric.cached,
      });
    }
  }

  /**
   * Get Web Vitals statistics
   */
  getWebVitalsStats() {
    const stats: Record<string, any> = {};
    
    for (const metric of this.webVitals) {
      if (!stats[metric.name]) {
        stats[metric.name] = {
          values: [],
          average: 0,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        };
      }
      
      stats[metric.name].values.push(metric.value);
      stats[metric.name].ratings[metric.rating]++;
    }

    // Calculate averages
    for (const name in stats) {
      const values = stats[name].values;
      stats[name].average = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      stats[name].min = Math.min(...values);
      stats[name].max = Math.max(...values);
    }

    return stats;
  }

  /**
   * Get API call statistics
   */
  getAPIStats() {
    const stats: Record<string, any> = {};
    
    for (const metric of this.apiMetrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      
      if (!stats[key]) {
        stats[key] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          cacheHits: 0,
          errors: 0,
        };
      }
      
      stats[key].count++;
      stats[key].totalDuration += metric.duration;
      stats[key].minDuration = Math.min(stats[key].minDuration, metric.duration);
      stats[key].maxDuration = Math.max(stats[key].maxDuration, metric.duration);
      
      if (metric.cached) {
        stats[key].cacheHits++;
      }
      
      if (metric.status >= 400) {
        stats[key].errors++;
      }
    }

    // Calculate averages and cache hit rates
    for (const key in stats) {
      stats[key].avgDuration = stats[key].totalDuration / stats[key].count;
      stats[key].cacheHitRate = (stats[key].cacheHits / stats[key].count) * 100;
      stats[key].errorRate = (stats[key].errors / stats[key].count) * 100;
    }

    return stats;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return {
      webVitals: this.getWebVitalsStats(),
      api: this.getAPIStats(),
      totalMetrics: {
        webVitals: this.webVitals.length,
        apiCalls: this.apiMetrics.length,
      },
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.webVitals = [];
    this.apiMetrics = [];
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(type: string, data: any): void {
    // Implement your analytics integration here
    // Examples: Google Analytics, Mixpanel, PostHog, etc.
    
    // For now, just use console in production
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', type, data);
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure API call duration
 * Usage:
 *   const measure = measureAPICall('GET', '/api/problems');
 *   const response = await fetch(...);
 *   measure(response.status);
 */
export function measureAPICall(method: string, endpoint: string, cached = false) {
  const startTime = performance.now();
  
  return (status: number) => {
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordAPICall({
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      cached,
    });
  };
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

/**
 * Mark a custom performance milestone
 */
export function markPerformance(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two performance marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure?.duration || null;
    } catch (error) {
      console.warn(`[Performance] Could not measure ${name}:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Get navigation timing info
 */
export function getNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  
  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    ttfb: timing.responseStart - timing.navigationStart,
    download: timing.responseEnd - timing.responseStart,
    domInteractive: timing.domInteractive - timing.navigationStart,
    domComplete: timing.domComplete - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,
  };
}

/**
 * Report all performance metrics
 */
export function reportPerformance(): void {
  const summary = performanceMonitor.getSummary();
  const navigation = getNavigationTiming();
  
  console.group('[Performance Report]');
  console.log('Web Vitals:', summary.webVitals);
  console.log('API Calls:', summary.api);
  console.log('Navigation Timing:', navigation);
  console.log('Total Metrics:', summary.totalMetrics);
  console.groupEnd();
}

/**
 * Initialize performance monitoring
 * Call this in your app layout or root component
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Report performance metrics when page is about to unload
  window.addEventListener('beforeunload', () => {
    if (process.env.NODE_ENV === 'development') {
      reportPerformance();
    }
  });

  console.log('[Performance] Monitoring initialized');
}

export default performanceMonitor;
