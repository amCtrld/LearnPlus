/**
 * API Request Logging Utility
 * 
 * Logs all API requests for monitoring, debugging, and security auditing
 * Tracks: method, path, duration, status, userId, IP, errors
 * 
 * Features:
 * - Automatic request/response logging
 * - Performance tracking
 * - Error capture
 * - User activity tracking
 * - Security event logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from './firebase-admin';

export interface RequestLog {
  timestamp: Date;
  method: string;
  path: string;
  duration: number;
  status: number;
  userId?: string;
  ip: string;
  userAgent?: string;
  error?: string;
  responseSize?: number;
  cached?: boolean;
}

/**
 * Log request to Firestore (for production monitoring)
 */
async function logToFirestore(log: RequestLog): Promise<void> {
  try {
    const db = getAdminFirestore();
    if (!db) return;

    await db.collection('requestLogs').add({
      ...log,
      timestamp: new Date(log.timestamp),
    });
  } catch (error) {
    // Don't throw - logging shouldn't break the app
    console.error('Failed to log request to Firestore:', error);
  }
}

/**
 * Log request to console (for development)
 */
function logToConsole(log: RequestLog): void {
  const color = log.status >= 500 ? '\x1b[31m' : // Red for 5xx
                log.status >= 400 ? '\x1b[33m' : // Yellow for 4xx
                log.status >= 300 ? '\x1b[36m' : // Cyan for 3xx
                '\x1b[32m'; // Green for 2xx
  
  const reset = '\x1b[0m';
  const method = log.method.padEnd(7);
  const status = log.status.toString().padStart(3);
  const duration = `${log.duration.toFixed(0)}ms`.padStart(7);
  
  console.log(
    `${color}[API]${reset} ${method} ${log.path} ${color}${status}${reset} ${duration}${
      log.error ? ` ${log.error}` : ''
    }`
  );
}

/**
 * Create request logger wrapper
 * Use this to wrap API route handlers for automatic logging
 */
export function withRequestLogging(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const startTime = performance.now();
    const url = new URL(request.url);
    
    let response: Response;
    let error: string | undefined;
    
    try {
      response = await handler(request);
    } catch (err: any) {
      error = err.message || 'Unknown error';
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    const duration = performance.now() - startTime;
    
    // Extract user ID from request if available
    const userId = request.headers.get('x-user-id') || undefined;
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    
    const log: RequestLog = {
      timestamp: new Date(),
      method: request.method,
      path: url.pathname,
      duration,
      status: response.status,
      userId,
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      error,
      responseSize: response.headers.get('content-length') 
        ? parseInt(response.headers.get('content-length')!) 
        : undefined,
      cached: response.headers.get('x-cache-hit') === 'true',
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logToConsole(log);
    }
    
    // Log to Firestore in production (async, don't await)
    if (process.env.NODE_ENV === 'production') {
      logToFirestore(log).catch(console.error);
    }
    
    return response;
  };
}

/**
 * Log security events (authentication failures, suspicious activity)
 */
export async function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const log = {
    timestamp: new Date(),
    event,
    severity,
    ...details,
  };
  
  // Always log security events
  console.warn('[SECURITY]', event, details);
  
  // Store in Firestore
  try {
    const db = getAdminFirestore();
    if (db) {
      await db.collection('securityLogs').add(log);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
  
  // Alert on critical events
  if (severity === 'critical') {
    // TODO: Send alert (email, webhook, etc.)
    console.error('[CRITICAL SECURITY EVENT]', event, details);
  }
}

/**
 * Get request logs for analysis
 * @param limit Number of logs to retrieve
 * @param filters Optional filters
 */
export async function getRequestLogs(
  limit: number = 100,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: number;
    method?: string;
    path?: string;
  }
): Promise<RequestLog[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  
  let query: any = db.collection('requestLogs')
    .orderBy('timestamp', 'desc')
    .limit(limit);
  
  if (filters?.startDate) {
    query = query.where('timestamp', '>=', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.where('timestamp', '<=', filters.endDate);
  }
  
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  
  if (filters?.method) {
    query = query.where('method', '==', filters.method);
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map((doc: any) => ({
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }));
}

/**
 * Get request statistics
 */
export async function getRequestStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalRequests: number;
  avgDuration: number;
  errorRate: number;
  statusCodes: Record<number, number>;
  topPaths: Array<{ path: string; count: number }>;
  slowestEndpoints: Array<{ path: string; avgDuration: number }>;
}> {
  const logs = await getRequestLogs(10000, { startDate, endDate });
  
  const stats = {
    totalRequests: logs.length,
    avgDuration: logs.reduce((sum, log) => sum + log.duration, 0) / logs.length,
    errorRate: (logs.filter(log => log.status >= 400).length / logs.length) * 100,
    statusCodes: {} as Record<number, number>,
    topPaths: [] as Array<{ path: string; count: number }>,
    slowestEndpoints: [] as Array<{ path: string; avgDuration: number }>,
  };
  
  // Count status codes
  logs.forEach(log => {
    stats.statusCodes[log.status] = (stats.statusCodes[log.status] || 0) + 1;
  });
  
  // Top paths
  const pathCounts = new Map<string, number>();
  logs.forEach(log => {
    pathCounts.set(log.path, (pathCounts.get(log.path) || 0) + 1);
  });
  stats.topPaths = Array.from(pathCounts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Slowest endpoints
  const pathDurations = new Map<string, number[]>();
  logs.forEach(log => {
    if (!pathDurations.has(log.path)) {
      pathDurations.set(log.path, []);
    }
    pathDurations.get(log.path)!.push(log.duration);
  });
  stats.slowestEndpoints = Array.from(pathDurations.entries())
    .map(([path, durations]) => ({
      path,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);
  
  return stats;
}

export default withRequestLogging;
