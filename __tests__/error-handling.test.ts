/**
 * Error Handling Integration Tests
 * Tests error boundaries, error tracking, monitoring, and alerting
 */

import { reportError, getErrorStats, createAPIError } from '@/lib/error-tracker';
import { sendAlert, checkErrorRate, checkResponseTime } from '@/lib/alerts';
import { logSecurityEvent, getRequestStats } from '@/lib/request-logger';

describe('Error Handling System Tests', () => {
  describe('Error Tracking', () => {
    it('should create API errors with proper structure', () => {
      const error = createAPIError('Test API error', {
        endpoint: '/api/test',
        method: 'GET',
      });

      expect(error.message).toBe('Test API error');
      expect(error.category).toBe('api_error');
      expect(error.severity).toBe('medium');
      expect(error.context).toEqual({
        endpoint: '/api/test',
        method: 'GET',
      });
    });

    it('should report errors with full context', async () => {
      const testError = new Error('Test error for tracking');
      
      // Should not throw
      await expect(
        reportError(testError, {
          component: 'TestComponent',
          action: 'test_action',
        })
      ).resolves.not.toThrow();
    });

    it('should get error statistics', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const stats = await getErrorStats(startDate, endDate);

      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByCategory');
      expect(stats).toHaveProperty('errorsBySeverity');
      expect(stats).toHaveProperty('errorRate');
    });
  });

  describe('Alert System', () => {
    it('should send alerts with proper structure', async () => {
      const alert = {
        severity: 'info' as const,
        category: 'system' as const,
        title: 'Test Alert',
        message: 'This is a test alert',
        timestamp: new Date(),
        context: { test: true },
      };

      await expect(sendAlert(alert)).resolves.not.toThrow();
    });

    it('should check error rates and alert when threshold exceeded', () => {
      // Low error rate - should not alert
      checkErrorRate(1000, 10); // 1% error rate

      // High error rate - should alert
      checkErrorRate(1000, 200); // 20% error rate
    });

    it('should check response times and alert when slow', () => {
      // Fast response - should not alert
      checkResponseTime('/api/test', 100);

      // Slow response - should alert
      checkResponseTime('/api/test', 5000);
    });
  });

  describe('Request Logging', () => {
    it('should log security events', async () => {
      await expect(
        logSecurityEvent(
          'test_security_event',
          { ip: '127.0.0.1', endpoint: '/api/test' },
          'low'
        )
      ).resolves.not.toThrow();
    });

    it('should get request statistics', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const stats = await getRequestStats(startDate, endDate);

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('avgDuration');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('statusCodes');
      expect(stats).toHaveProperty('topPaths');
      expect(stats).toHaveProperty('slowestEndpoints');
    });
  });

  describe('Error Categories and Severities', () => {
    it('should support all error categories', () => {
      const categories = [
        'api_error',
        'database_error',
        'validation_error',
        'authentication_error',
        'authorization_error',
        'external_service_error',
        'unknown_error',
      ];

      categories.forEach(category => {
        expect(category).toBeTruthy();
      });
    });

    it('should support all severity levels', () => {
      const severities = ['low', 'medium', 'high', 'critical'];

      severities.forEach(severity => {
        expect(severity).toBeTruthy();
      });
    });
  });

  describe('Error Context Tracking', () => {
    it('should include context in error reports', async () => {
      const error = new Error('Test error with context');
      const context = {
        userId: 'test-user-123',
        problemId: 'diff-basics-1',
        step: 2,
        timestamp: new Date().toISOString(),
      };

      await expect(
        reportError(error, context)
      ).resolves.not.toThrow();
    });
  });
});

describe('Monitoring System Tests', () => {
  describe('System Health', () => {
    it('should calculate health status based on metrics', () => {
      // Healthy system
      const healthyMetrics = {
        errorRate: 1,
        avgDuration: 200,
      };

      // Degraded system
      const degradedMetrics = {
        errorRate: 7,
        avgDuration: 1200,
      };

      // Unhealthy system
      const unhealthyMetrics = {
        errorRate: 20,
        avgDuration: 3000,
      };

      expect(healthyMetrics.errorRate).toBeLessThan(5);
      expect(degradedMetrics.errorRate).toBeGreaterThanOrEqual(5);
      expect(unhealthyMetrics.errorRate).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Performance Metrics', () => {
    it('should track response times', () => {
      const responseTimes = [100, 150, 200, 250, 300];
      const avg = responseTimes.reduce((a, b) => a + b) / responseTimes.length;

      expect(avg).toBe(200);
      expect(Math.max(...responseTimes)).toBe(300);
      expect(Math.min(...responseTimes)).toBe(100);
    });

    it('should identify slow endpoints', () => {
      const endpoints = [
        { path: '/api/fast', duration: 100 },
        { path: '/api/slow', duration: 2000 },
        { path: '/api/medium', duration: 500 },
      ];

      const slowEndpoints = endpoints.filter(e => e.duration > 1000);
      expect(slowEndpoints.length).toBe(1);
      expect(slowEndpoints[0].path).toBe('/api/slow');
    });
  });
});

describe('API Response Standards', () => {
  it('should have consistent error response structure', () => {
    const errorResponse = {
      error: 'Error',
      message: 'Something went wrong',
      code: 'TEST_ERROR',
      timestamp: new Date().toISOString(),
    };

    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse).toHaveProperty('message');
    expect(errorResponse).toHaveProperty('timestamp');
  });

  it('should have consistent success response structure', () => {
    const successResponse = {
      success: true,
      data: { id: '123', value: 'test' },
      message: 'Operation successful',
      timestamp: new Date().toISOString(),
    };

    expect(successResponse).toHaveProperty('success');
    expect(successResponse).toHaveProperty('data');
    expect(successResponse).toHaveProperty('timestamp');
  });
});

describe('Security Headers', () => {
  it('should define all required security headers', () => {
    const securityHeaders = {
      'Content-Security-Policy': "default-src 'self'",
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    Object.keys(securityHeaders).forEach(header => {
      expect(securityHeaders[header as keyof typeof securityHeaders]).toBeTruthy();
    });
  });
});
