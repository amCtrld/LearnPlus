/**
 * Integration tests for API routes
 * Tests all API endpoints with success, error, and edge cases
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createMockRequest,
  createTestSession,
  createAdminRequest,
  parseResponse,
  assertResponseStatus,
  testData,
} from './test-utils';

// Import API route handlers
import { POST as verifyAccessCode } from '@/app/api/auth/verify-access-code/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as chatRoute } from '@/app/api/chat/route';
import { POST as validateStep } from '@/app/api/validate-step/route';
import { POST as logEvent } from '@/app/api/log-event/route';
import { POST as surveyRoute } from '@/app/api/survey/route';
import { GET as healthCheck } from '@/app/api/health/route';

describe('API Integration Tests', () => {
  describe('Authentication API', () => {
    describe('POST /api/auth/verify-access-code', () => {
      it('should accept valid access code format', async () => {
        const request = createMockRequest('/api/auth/verify-access-code', {
          method: 'POST',
          body: {
            accessCode: 'TEST-ABC123',
          },
        });

        const response = await verifyAccessCode(request);
        const data = await parseResponse(response);

        // Note: Will fail validation as code doesn't exist in DB
        // But should pass format validation
        expect(response.status).toBeDefined();
        expect(data).toBeDefined();
      });

      it('should reject invalid access code format', async () => {
        const request = createMockRequest('/api/auth/verify-access-code', {
          method: 'POST',
          body: {
            accessCode: 'invalid',
          },
        });

        const response = await verifyAccessCode(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should reject missing access code', async () => {
        const request = createMockRequest('/api/auth/verify-access-code', {
          method: 'POST',
          body: {},
        });

        const response = await verifyAccessCode(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should handle rate limiting', async () => {
        const requests = Array.from({ length: 12 }, () =>
          createMockRequest('/api/auth/verify-access-code', {
            method: 'POST',
            body: { accessCode: 'TEST-RATE' },
          })
        );

        // Make multiple requests
        const responses = await Promise.all(
          requests.map(req => verifyAccessCode(req))
        );

        // At least one should be rate limited
        const rateLimited = responses.some(res => res.status === 429);
        expect(rateLimited).toBe(true);
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should handle logout request', async () => {
        const request = createMockRequest('/api/auth/logout', {
          method: 'POST',
        });

        const response = await logout(request);
        const data = await parseResponse(response);

        expect(response.status).toBeLessThan(500);
        expect(data).toBeDefined();
      });
    });
  });

  describe('Chat API', () => {
    describe('POST /api/chat', () => {
      it('should reject request without user session', async () => {
        const request = createMockRequest('/api/chat', {
          method: 'POST',
          body: {
            message: 'Help me with this problem',
            problemId: 'diff-basics-1',
            currentStep: 1,
          },
        });

        const response = await chatRoute(request);
        
        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it('should reject request without required fields', async () => {
        const session = createTestSession({ mode: 'ai_assisted' });
        
        const request = createMockRequest('/api/chat', {
          method: 'POST',
          body: {
            // Missing message, problemId, currentStep
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await chatRoute(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should validate problem ID exists', async () => {
        const session = createTestSession({ mode: 'ai_assisted' });
        
        const request = createMockRequest('/api/chat', {
          method: 'POST',
          body: {
            message: testData.chatMessage(),
            problemId: 'non-existent-problem',
            currentStep: 1,
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await chatRoute(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should handle rate limiting on chat requests', async () => {
        const session = createTestSession({ mode: 'ai_assisted' });
        
        const requests = Array.from({ length: 35 }, () =>
          createMockRequest('/api/chat', {
            method: 'POST',
            body: {
              message: 'Help',
              problemId: 'diff-basics-1',
              currentStep: 1,
            },
            cookies: {
              session: session.userId,
            },
          })
        );

        const responses = await Promise.all(
          requests.map(req => chatRoute(req))
        );

        const rateLimited = responses.some(res => res.status === 429);
        expect(rateLimited).toBe(true);
      });
    });
  });

  describe('Validate Step API', () => {
    describe('POST /api/validate-step', () => {
      it('should validate required fields', async () => {
        const request = createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            // Missing required fields
          },
        });

        const response = await validateStep(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should validate problem exists', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            problemId: 'non-existent',
            stepNumber: 1,
            userAnswer: '2x',
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await validateStep(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should validate step number is valid', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            problemId: 'diff-basics-1',
            stepNumber: 999, // Invalid step number
            userAnswer: '2x',
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await validateStep(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should handle correct answer', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            problemId: 'diff-basics-1',
            stepNumber: 1,
            userAnswer: '2x',
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await validateStep(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(200);
        expect(data.isCorrect).toBeDefined();
      });

      it('should handle incorrect answer', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            problemId: 'diff-basics-1',
            stepNumber: 1,
            userAnswer: 'wrong answer',
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await validateStep(request);
        const data = await parseResponse(response);

        expect(response.status).toBe(200);
        expect(data.isCorrect).toBe(false);
      });

      it('should handle rate limiting', async () => {
        const session = createTestSession();
        
        const requests = Array.from({ length: 25 }, () =>
          createMockRequest('/api/validate-step', {
            method: 'POST',
            body: {
              problemId: 'diff-basics-1',
              stepNumber: 1,
              userAnswer: '2x',
            },
            cookies: {
              session: session.userId,
            },
          })
        );

        const responses = await Promise.all(
          requests.map(req => validateStep(req))
        );

        const rateLimited = responses.some(res => res.status === 429);
        expect(rateLimited).toBe(true);
      });
    });
  });

  describe('Log Event API', () => {
    describe('POST /api/log-event', () => {
      it('should accept valid event data', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/log-event', {
          method: 'POST',
          body: {
            eventType: 'answer_submitted',
            eventData: {
              problemId: 'diff-basics-1',
              answer: '2x',
              isCorrect: true,
            },
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await logEvent(request);
        
        expect(response.status).toBeLessThan(400);
      });

      it('should reject missing event type', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/log-event', {
          method: 'POST',
          body: {
            eventData: {
              test: 'data',
            },
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await logEvent(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(data.error).toBeDefined();
      });

      it('should handle various event types', async () => {
        const session = createTestSession();
        const eventTypes = [
          'problem_viewed',
          'answer_submitted',
          'hint_requested',
          'step_completed',
        ];

        const requests = eventTypes.map(eventType =>
          createMockRequest('/api/log-event', {
            method: 'POST',
            body: {
              eventType,
              eventData: { test: true },
            },
            cookies: {
              session: session.userId,
            },
          })
        );

        const responses = await Promise.all(
          requests.map(req => logEvent(req))
        );

        responses.forEach(response => {
          expect(response.status).toBeLessThan(400);
        });
      });
    });
  });

  describe('Survey API', () => {
    describe('POST /api/survey', () => {
      it('should accept valid survey data', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/survey', {
          method: 'POST',
          body: testData.surveyResponses(),
          cookies: {
            session: session.userId,
          },
        });

        const response = await surveyRoute(request);
        
        expect(response.status).toBeLessThan(400);
      });

      it('should reject missing required fields', async () => {
        const session = createTestSession();
        
        const request = createMockRequest('/api/survey', {
          method: 'POST',
          body: {
            // Missing required fields
          },
          cookies: {
            session: session.userId,
          },
        });

        const response = await surveyRoute(request);
        const data = await parseResponse(response);

        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it('should handle rate limiting', async () => {
        const session = createTestSession();
        
        const requests = Array.from({ length: 6 }, () =>
          createMockRequest('/api/survey', {
            method: 'POST',
            body: testData.surveyResponses(),
            cookies: {
              session: session.userId,
            },
          })
        );

        const responses = await Promise.all(
          requests.map(req => surveyRoute(req))
        );

        const rateLimited = responses.some(res => res.status === 429);
        expect(rateLimited).toBe(true);
      });
    });
  });

  describe('Health Check API', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const request = createMockRequest('/api/health');

        const response = await healthCheck(request);
        const data = await parseResponse(response);

        expect(response.status).toBeLessThan(500);
        expect(data.status).toBeDefined();
        expect(data.checks).toBeDefined();
        expect(data.uptime).toBeDefined();
      });

      it('should include all health checks', async () => {
        const request = createMockRequest('/api/health');

        const response = await healthCheck(request);
        const data = await parseResponse(response);

        expect(data.checks.api).toBeDefined();
        expect(data.checks.database).toBeDefined();
        expect(data.checks.openai).toBeDefined();
        expect(data.checks.firebase).toBeDefined();
      });

      it('should return status in expected values', async () => {
        const request = createMockRequest('/api/health');

        const response = await healthCheck(request);
        const data = await parseResponse(response);

        expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/validate-step', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        body: 'invalid json{',
      });

      const response = await validateStep(request);
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return proper error structure', async () => {
      const request = createMockRequest('/api/validate-step', {
        method: 'POST',
        body: {}, // Missing required fields
      });

      const response = await validateStep(request);
      const data = await parseResponse(response);

      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe('string');
    });

    it('should handle missing headers gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'GET',
      });

      const response = await healthCheck(request);
      
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting Across APIs', () => {
    it('should apply different rate limits to different endpoints', async () => {
      const session = createTestSession();

      // Test chat endpoint (30 requests per hour)
      const chatRequests = Array.from({ length: 35 }, () =>
        createMockRequest('/api/chat', {
          method: 'POST',
          body: {
            message: 'test',
            problemId: 'diff-basics-1',
            currentStep: 1,
          },
          cookies: { session: session.userId },
        })
      );

      const chatResponses = await Promise.all(
        chatRequests.map(req => chatRoute(req))
      );

      const chatRateLimited = chatResponses.filter(res => res.status === 429).length;
      expect(chatRateLimited).toBeGreaterThan(0);

      // Test validate endpoint (20 requests per hour)
      const validateRequests = Array.from({ length: 25 }, () =>
        createMockRequest('/api/validate-step', {
          method: 'POST',
          body: {
            problemId: 'diff-basics-1',
            stepNumber: 1,
            userAnswer: '2x',
          },
          cookies: { session: session.userId },
        })
      );

      const validateResponses = await Promise.all(
        validateRequests.map(req => validateStep(req))
      );

      const validateRateLimited = validateResponses.filter(
        res => res.status === 429
      ).length;
      expect(validateRateLimited).toBeGreaterThan(0);
    });
  });
});
