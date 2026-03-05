/**
 * GET /api/admin/monitoring
 * Returns system monitoring data for admin dashboard
 * 
 * Security: Requires admin API key authentication
 * Rate limit: 10 requests per hour
 * 
 * Returns: Performance metrics, error stats, system health, alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit, getClientIP, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getRequestStats } from '@/lib/request-logger';
import { getErrorStats } from '@/lib/error-tracker';
import { getRecentAlerts } from '@/lib/alerts';
import { getAllCacheStats } from '@/lib/cache';
import { performanceMonitor } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = validateAdminRequest(request);
    if (authError) {
      return authError;
    }

    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(
      `admin-monitoring:${clientIP}`,
      RATE_LIMITS.ADMIN_GENERATE_CODES
    );

    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    // Time range: last 24 hours
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    // Gather monitoring data
    const [requestStats, errorStats, recentAlerts] = await Promise.all([
      getRequestStats(startDate, endDate).catch(() => null),
      getErrorStats(startDate, endDate).catch(() => null),
      getRecentAlerts(20).catch(() => []),
    ]);

    // Get performance metrics
    const performanceSummary = performanceMonitor.getSummary();

    // Get cache statistics
    const cacheStats = getAllCacheStats();

    // Calculate derived metrics
    const systemHealth = {
      status: calculateSystemHealth(requestStats, errorStats),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      timestamp: new Date().toISOString(),
    };

    // Compile monitoring dashboard data
    const monitoringData = {
      systemHealth,
      requests: requestStats ? {
        total: requestStats.totalRequests,
        avgDuration: Math.round(requestStats.avgDuration),
        errorRate: requestStats.errorRate.toFixed(2) + '%',
        statusCodes: requestStats.statusCodes,
        topEndpoints: requestStats.topPaths.slice(0, 5),
        slowestEndpoints: requestStats.slowestEndpoints.slice(0, 5),
      } : null,
      errors: errorStats ? {
        total: errorStats.totalErrors,
        byCategory: errorStats.errorsByCategory,
        bySeverity: errorStats.errorsBySeverity,
        topErrors: errorStats.topErrors.slice(0, 5),
        errorRate: errorStats.errorRate.toFixed(2) + '%',
      } : null,
      performance: {
        webVitals: performanceSummary.webVitals,
        apiCalls: Object.keys(performanceSummary.api).length,
        totalMetrics: performanceSummary.totalMetrics,
      },
      cache: {
        problems: cacheStats.problems,
        sessions: cacheStats.sessions,
        aiResponses: cacheStats.aiResponses,
        mathValidation: cacheStats.mathValidation,
        totalCached: Object.values(cacheStats).reduce((sum, cache) => sum + cache.size, 0),
      },
      alerts: {
        recent: recentAlerts.map(alert => ({
          severity: alert.severity,
          category: alert.category,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved || false,
        })),
        unresolved: recentAlerts.filter(a => !a.resolved).length,
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
      },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        hours: 24,
      },
    };

    return NextResponse.json(monitoringData, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall system health status
 */
function calculateSystemHealth(
  requestStats: any,
  errorStats: any
): 'healthy' | 'degraded' | 'unhealthy' {
  // No data available
  if (!requestStats || !errorStats) {
    return 'degraded';
  }

  // Check error rate
  if (requestStats.errorRate > 15) {
    return 'unhealthy';
  } else if (requestStats.errorRate > 5) {
    return 'degraded';
  }

  // Check average response time
  if (requestStats.avgDuration > 2000) {
    return 'unhealthy';
  } else if (requestStats.avgDuration > 1000) {
    return 'degraded';
  }

  return 'healthy';
}
