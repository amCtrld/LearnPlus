/**
 * Error Tracking and Reporting Utility
 * 
 * Centralized error handling for consistent error logging and reporting
 * Integrates with error tracking services (Sentry, etc.)
 * 
 * Features:
 * - Structured error logging
 * - Error categorization
 * - User context tracking
 * - Stack trace capture
 * - Error aggregation
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'api_error'
  | 'database_error'
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'external_service_error'
  | 'unknown_error';

export interface ErrorReport {
  id?: string;
  timestamp: Date;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  count?: number; // For aggregated errors
}

/**
 * Application Error class with additional context
 */
export class AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  
  constructor(
    message: string,
    category: ErrorCategory = 'unknown_error',
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.context = context;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Log error to Firestore via API route (safe for client components)
 */
async function logErrorToFirestore(error: ErrorReport): Promise<void> {
  try {
    const baseUrl = typeof window !== 'undefined'
      ? ''
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'error',
        data: {
          message: error.message,
          category: error.category,
          severity: error.severity,
          stack: error.stack,
          context: error.context,
          url: error.url,
          timestamp: error.timestamp.toISOString(),
        },
      }),
    });
  } catch (err) {
    console.error('Failed to log error to Firestore:', err);
  }
}

/**
 * Log error to console with formatting
 */
function logErrorToConsole(error: ErrorReport): void {
  const severityColors = {
    low: '\x1b[36m',      // Cyan
    medium: '\x1b[33m',   // Yellow
    high: '\x1b[35m',     // Magenta
    critical: '\x1b[31m', // Red
  };
  
  const color = severityColors[error.severity];
  const reset = '\x1b[0m';
  
  console.error(
    `${color}[ERROR:${error.severity.toUpperCase()}]${reset}`,
    error.category,
    error.message
  );
  
  if (error.context) {
    console.error('Context:', error.context);
  }
  
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
}

/**
 * Report error with full context
 */
export async function reportError(
  error: Error | AppError,
  additionalContext?: Record<string, any>
): Promise<void> {
  const isAppError = error instanceof AppError;
  
  const errorReport: ErrorReport = {
    timestamp: new Date(),
    message: error.message,
    stack: error.stack,
    category: isAppError ? error.category : 'unknown_error',
    severity: isAppError ? error.severity : 'medium',
    context: isAppError ? { ...error.context, ...additionalContext } : additionalContext,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };
  
  // Log to console
  logErrorToConsole(errorReport);
  
  // Log to Firestore (async, don't await)
  if (process.env.NODE_ENV === 'production') {
    logErrorToFirestore(errorReport).catch(console.error);
  }
  
  // Send to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // TODO: Integrate with Sentry or other error tracking service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { custom: errorReport.context } });
    // }
  }
  
  // Alert on critical errors
  if (errorReport.severity === 'critical') {
    console.error('[CRITICAL ERROR]', errorReport);
    // TODO: Send alert (email, webhook, Slack, etc.)
  }
}

/**
 * Create specific error types
 */
export function createAPIError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'api_error', 'medium', context);
}

export function createDatabaseError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'database_error', 'high', context);
}

export function createValidationError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'validation_error', 'low', context);
}

export function createAuthenticationError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'authentication_error', 'medium', context);
}

export function createAuthorizationError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'authorization_error', 'high', context);
}

export function createExternalServiceError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, 'external_service_error', 'high', context);
}

/**
 * Get error statistics
 */
export async function getErrorStats(
  startDate: Date,
  endDate: Date
): Promise<{
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  topErrors: Array<{ message: string; count: number }>;
  errorRate: number;
}> {
  const db = getAdminFirestore();
  if (!db) {
    return {
      totalErrors: 0,
      errorsByCategory: {} as any,
      errorsBySeverity: {} as any,
      topErrors: [],
      errorRate: 0,
    };
  }
  
  const snapshot = await db.collection('errorLogs')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
  
  const errors = snapshot.docs.map((doc: any) => doc.data());
  
  const stats = {
    totalErrors: errors.length,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    topErrors: [] as Array<{ message: string; count: number }>,
    errorRate: 0,
  };
  
  // Count by category
  errors.forEach((error: any) => {
    const category = error.category as ErrorCategory;
    const severity = error.severity as ErrorSeverity;
    stats.errorsByCategory[category] = (stats.errorsByCategory[category] || 0) + 1;
    stats.errorsBySeverity[severity] = (stats.errorsBySeverity[severity] || 0) + 1;
  });
  
  // Top errors
  const errorCounts = new Map<string, number>();
  errors.forEach((error: any) => {
    errorCounts.set(error.message, (errorCounts.get(error.message) || 0) + 1);
  });
  stats.topErrors = Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return stats;
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorCategory: ErrorCategory = 'unknown_error'
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      const appError = new AppError(
        error.message || 'Unknown error',
        errorCategory,
        'medium',
        { originalError: error.toString() }
      );
      await reportError(appError);
      throw appError;
    }
  }) as T;
}

/**
 * Initialize error tracking
 */
export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Global error handler
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(event.reason), {
      type: 'unhandled_rejection',
    });
  });
  
  console.log('[Error Tracking] Initialized');
}

export default reportError;
