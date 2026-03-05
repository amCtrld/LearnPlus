# Phase 7 Quick Reference Guide

**Error Handling & Monitoring System - Developer Reference**

---

## 🚀 Quick Start

### 1. Wrap API Routes with Request Logging
```typescript
import { withRequestLogging } from '@/lib/request-logger';

export const GET = withRequestLogging(async (request: NextRequest) => {
  // Your handler logic
  return NextResponse.json({ data: 'success' });
});
```

### 2. Use Standardized Responses
```typescript
import { createSuccessResponse, createServerError } from '@/lib/api-responses';

try {
  const data = await fetchData();
  return createSuccessResponse(data, 'Operation successful');
} catch (error: any) {
  return createServerError(error, 'Failed to fetch data');
}
```

### 3. Report Errors
```typescript
import { reportError } from '@/lib/error-tracker';

try {
  // Risky operation
} catch (error) {
  reportError(error, {
    component: 'MyComponent',
    userId: session.userId,
    action: 'submit_answer',
  });
  throw error; // Re-throw after reporting
}
```

### 4. Wrap Components with Error Boundary
```typescript
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## 📊 Monitoring

### Health Check
```bash
# Check system health
curl https://your-domain.com/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345,
  "checks": {
    "api": { "status": "healthy", "responseTime": 45 },
    "database": { "status": "healthy", "responseTime": 120 }
  }
}
```

### Monitoring Dashboard
```bash
# Requires admin API key
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  https://your-domain.com/api/admin/monitoring

# Response includes:
# - System health
# - Request statistics
# - Error statistics
# - Performance metrics
# - Cache statistics
# - Recent alerts
```

---

## 🔔 Alert System

### Send Custom Alerts
```typescript
import { alertSecurityIssue, alertPerformanceIssue } from '@/lib/alerts';

// Security alert
await alertSecurityIssue(
  'Suspicious activity detected',
  'critical',
  { ip: clientIP, endpoint: '/api/sensitive' }
);

// Performance alert
await alertPerformanceIssue(
  'Slow database query',
  'warning',
  { query: 'getUserData', duration: 1500 }
);
```

### Monitor Error Rates
```typescript
import { checkErrorRate } from '@/lib/alerts';

// Automatically alerts at 5% (warning) and 15% (critical)
checkErrorRate(totalRequests, errorCount);
```

### Monitor Response Times
```typescript
import { checkResponseTime } from '@/lib/alerts';

// Automatically alerts at 1000ms (warning) and 3000ms (critical)
checkResponseTime('/api/chat', responseTime);
```

---

## 🛠️ API Response Utilities

### Success Responses
```typescript
import { createSuccessResponse, HttpStatus } from '@/lib/api-responses';

// Simple success
return createSuccessResponse(data);

// With message
return createSuccessResponse(data, 'User created successfully');

// With custom status
return createSuccessResponse(data, 'Created', HttpStatus.CREATED);
```

### Error Responses
```typescript
import { 
  createErrorResponse,
  createValidationError,
  createAuthError,
  createNotFoundError,
  ErrorMessages 
} from '@/lib/api-responses';

// Generic error
return createErrorResponse(ErrorMessages.INVALID_INPUT);

// Validation error
return createValidationError('email', 'Invalid email format');

// Authentication error
return createAuthError();

// Not found error
return createNotFoundError('User');
```

---

## 📝 Error Categories & Severities

### Error Categories
```typescript
'api_error'               // API endpoint failures
'database_error'          // Database issues
'validation_error'        // Input validation failures
'authentication_error'    // Auth failures
'authorization_error'     // Permission denials
'external_service_error'  // Third-party API failures
'unknown_error'           // Uncategorized errors
```

### Severity Levels
```typescript
'low'      // Minor issues, no user impact
'medium'   // Noticeable issues, degraded experience
'high'     // Significant issues, feature unavailable
'critical' // System failure, immediate attention required
```

---

## 🔧 Error Factory Functions

```typescript
import {
  createAPIError,
  createDatabaseError,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createExternalServiceError,
} from '@/lib/error-tracker';

// Create typed errors
throw createAPIError('Invalid request parameters', { endpoint: '/api/users' });
throw createDatabaseError('Connection timeout', { collection: 'users' });
throw createValidationError('Email format invalid', { field: 'email' });
```

---

## 📊 Request Logging

### Automatic Logging (via withRequestLogging)
Captures automatically:
- Request method, path, headers
- Response status, duration
- User ID, IP address, user agent
- Timestamp

### Manual Security Logging
```typescript
import { logSecurityEvent } from '@/lib/request-logger';

await logSecurityEvent(
  'unauthorized_access_attempt',
  { userId, endpoint, reason },
  'high'
);
```

### Query Logs
```typescript
import { getRequestLogs, getRequestStats } from '@/lib/request-logger';

// Get recent logs
const logs = await getRequestLogs(100, {
  status: 500,
  path: '/api/users',
});

// Get statistics
const stats = await getRequestStats(startDate, endDate);
console.log(stats.errorRate);      // "2.14%"
console.log(stats.avgDuration);    // 245ms
console.log(stats.topPaths);       // Most accessed endpoints
console.log(stats.slowestEndpoints); // Slowest endpoints
```

---

## 🎯 Error Handling Patterns

### Pattern 1: API Route with Full Error Handling
```typescript
import { NextRequest } from 'next/server';
import { withRequestLogging } from '@/lib/request-logger';
import { withErrorHandling, createDatabaseError } from '@/lib/error-tracker';
import { createSuccessResponse, createServerError } from '@/lib/api-responses';
import { alertDatabaseIssue } from '@/lib/alerts';

export const GET = withRequestLogging(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const data = await db.collection('users').get();
      return createSuccessResponse(data, 'Users retrieved successfully');
    } catch (error: any) {
      // Alert on critical issues
      if (error.code === 'permission-denied') {
        await alertDatabaseIssue('Permission denied', 'critical', { error });
      }
      
      // Report error
      throw createDatabaseError('Failed to fetch users', { error: error.message });
    }
  }, 'database_error')
);
```

### Pattern 2: Component with Error Boundary
```typescript
import { withErrorBoundary } from '@/components/error-boundary';
import { reportError } from '@/lib/error-tracker';

function ProblematicComponent({ data }) {
  if (!data) {
    const error = new Error('Data is required');
    reportError(error, { component: 'ProblematicComponent' });
    throw error;
  }
  
  return <div>{data.title}</div>;
}

export default withErrorBoundary(ProblematicComponent, {
  fallbackMessage: 'Failed to load content',
});
```

### Pattern 3: Async Operation with Error Handling
```typescript
import { withErrorHandling } from '@/lib/error-tracker';

const safeDataFetch = withErrorHandling(
  async (userId: string) => {
    const user = await db.collection('users').doc(userId).get();
    return user.data();
  },
  'database_error'
);

// Usage
try {
  const userData = await safeDataFetch(userId);
} catch (error) {
  console.error('Failed to fetch user:', error);
}
```

---

## 🔒 Security Headers

Applied automatically to all routes via middleware:

- **Content-Security-Policy:** Restricts script sources, prevents XSS
- **Strict-Transport-Security:** Forces HTTPS (1 year)
- **X-Frame-Options:** DENY (prevents clickjacking)
- **X-Content-Type-Options:** nosniff (prevents MIME sniffing)
- **X-XSS-Protection:** Enabled with blocking
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** Disables camera, mic, geolocation

---

## 📈 Performance Monitoring

### Track Custom Metrics
```typescript
import { performanceMonitor } from '@/lib/performance';

// Track an operation
performanceMonitor.startMark('data-fetch');
await fetchData();
performanceMonitor.endMark('data-fetch');

// Get metrics
const metrics = performanceMonitor.getMetrics('data-fetch');
console.log(metrics.avg); // Average duration
```

### Check Performance Summary
```typescript
const summary = performanceMonitor.getSummary();
console.log(summary.webVitals);   // Web vitals metrics
console.log(summary.api);         // API call metrics
console.log(summary.totalMetrics); // Total tracked metrics
```

---

## 🎨 Custom Error Pages

### Global Error (error.tsx)
Catches all rendering errors:
- Shows user-friendly message
- Provides recovery actions (Try Again, Reload, Go Home)
- Shows stack trace in development only
- Reports to error tracker automatically

### Not Found (not-found.tsx)
Displays for 404 routes:
- Clean, friendly design
- Helpful explanations
- Navigation buttons

---

## 📚 User-Friendly Error Messages

All available in `ErrorMessages` constant:

```typescript
import { ErrorMessages } from '@/lib/api-responses';

// Authentication
ErrorMessages.INVALID_ACCESS_CODE
ErrorMessages.ACCESS_CODE_EXPIRED
ErrorMessages.UNAUTHORIZED

// Validation
ErrorMessages.INVALID_INPUT
ErrorMessages.INVALID_ANSWER_FORMAT

// Rate Limiting
ErrorMessages.RATE_LIMIT_EXCEEDED

// AI Tutor
ErrorMessages.AI_SERVICE_UNAVAILABLE

// Database
ErrorMessages.DATABASE_ERROR
ErrorMessages.SAVE_FAILED

// General
ErrorMessages.INTERNAL_ERROR
ErrorMessages.NOT_FOUND
```

---

## 🧪 Testing Error Handling

### Test Error Boundary
```typescript
// Intentionally throw error to test boundary
if (process.env.NODE_ENV === 'development' && testError) {
  throw new Error('Test error boundary');
}
```

### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

### Test Monitoring Endpoint
```bash
curl -H "x-admin-key: test_key" \
  http://localhost:3000/api/admin/monitoring
```

### Test Alert System
```typescript
import { sendAlert } from '@/lib/alerts';

// Send test alert
await sendAlert({
  severity: 'info',
  category: 'system',
  title: 'Test Alert',
  message: 'Testing alert system',
  timestamp: new Date(),
  context: { test: true },
});
```

---

## 🔍 Debugging

### Console Logging
All logging is color-coded by severity:
- 🔵 **Info:** Blue
- 🟡 **Warning:** Yellow
- 🔴 **Error:** Red
- 🔴 **Critical:** Bold Red

### View Error Logs
```typescript
import { getErrorStats } from '@/lib/error-tracker';

const stats = await getErrorStats(startDate, endDate);
console.log(stats.totalErrors);
console.log(stats.errorsByCategory);
console.log(stats.errorsBySeverity);
console.log(stats.topErrors);
```

### View Request Logs
```typescript
import { getRequestStats } from '@/lib/request-logger';

const stats = await getRequestStats(startDate, endDate);
console.log(stats.totalRequests);
console.log(stats.errorRate);
console.log(stats.avgDuration);
console.log(stats.slowestEndpoints);
```

---

## 🚨 Production Monitoring Setup

### 1. Set Up Health Check Monitoring
Configure external service (UptimeRobot, Pingdom):
- **URL:** `https://your-domain.com/api/health`
- **Interval:** 5 minutes
- **Alert on:** HTTP 503 or timeout

### 2. Configure Alert Notifications
```bash
# Environment variables for alert channels
ALERT_EMAIL=alerts@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3. Create Admin Dashboard
Fetch monitoring data:
```typescript
const response = await fetch('/api/admin/monitoring', {
  headers: { 'x-admin-key': process.env.ADMIN_API_KEY },
});
const data = await response.json();
```

### 4. Set Up Log Retention
Create Cloud Scheduler job to clean old logs:
```typescript
// Delete logs older than 30 days
const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
await db.collection('api_requests')
  .where('timestamp', '<', cutoffDate)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });
```

---

## 💡 Best Practices

1. **Always wrap API routes** with `withRequestLogging()`
2. **Use standardized responses** from `lib/api-responses`
3. **Report errors with context** using `reportError()`
4. **Wrap critical components** with `<ErrorBoundary>`
5. **Use error factory functions** for typed errors
6. **Monitor critical metrics** with alert functions
7. **Never expose stack traces** in production
8. **Log security events** with `logSecurityEvent()`
9. **Check health endpoint** regularly
10. **Review monitoring dashboard** weekly

---

## 📞 Support

### View Recent Alerts
```typescript
import { getRecentAlerts } from '@/lib/alerts';

const alerts = await getRecentAlerts(20, 'critical');
alerts.forEach(alert => {
  console.log(`[${alert.severity}] ${alert.title}: ${alert.message}`);
});
```

### Resolve Alerts
```typescript
import { resolveAlert } from '@/lib/alerts';

await resolveAlert(alertId);
```

---

**Phase 7 Complete** ✅  
All error handling and monitoring features ready for production use.
